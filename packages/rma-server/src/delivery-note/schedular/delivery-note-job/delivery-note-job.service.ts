import { Injectable, Inject } from '@nestjs/common';
import { switchMap, mergeMap, catchError, retry } from 'rxjs/operators';
import {
  VALIDATE_AUTH_STRING,
  COMPLETED_STATUS,
  TO_DELIVER_STATUS,
  CREATE_DELIVERY_NOTE_JOB,
  AGENDA_JOB_STATUS,
  FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB,
  DELIVERY_NOTE_DOCTYPE,
  SYNC_DELIVERY_NOTE_JOB,
  DEFAULT_NAMING_SERIES,
  DEFAULT_CURRENCY,
} from '../../../constants/app-strings';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { of, throwError, Observable } from 'rxjs';
import { CreateDeliveryNoteInterface } from '../../entity/delivery-note-service/create-delivery-note-interface';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DateTime } from 'luxon';
import { SalesInvoice } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { FRAPPE_QUEUE_JOB } from '../../../constants/app-strings';
import Agenda = require('agenda');
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { DeliveryNoteJobHelperService } from '../delivery-note-job-helper/delivery-note-job-helper.service';
import * as uuid from 'uuid/v4';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { AgendaJobService } from '../../../sync/entities/agenda-job/agenda-job.service';
import {
  DataImportService,
  SingleDoctypeResponseInterface,
} from '../../../sync/aggregates/data-import/data-import.service';
import { JsonToCSVParserService } from '../../../sync/entities/agenda-job/json-to-csv-parser.service';
import {
  CSV_TEMPLATE_HEADERS,
  CSV_TEMPLATE,
} from '../../../sync/assets/data_import_template';
import { DataImportSuccessResponse } from '../../../sync/entities/agenda-job/agenda-job.entity';
export const CREATE_STOCK_ENTRY_JOB = 'CREATE_STOCK_ENTRY_JOB';

@Injectable()
export class DeliveryNoteJobService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenService: DirectService,
    private readonly serialNoService: SerialNoService,
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly jobService: AgendaJobService,
    private readonly jobHelper: DeliveryNoteJobHelperService,
    private readonly csvService: JsonToCSVParserService,
    private readonly importData: DataImportService,
  ) {}

  execute(job) {
    return this.createDeliveryNote(job.attrs.data);
  }

  resetState(job: {
    data: {
      payload: CreateDeliveryNoteInterface;
      token: any;
      settings: ServerSettings;
      sales_invoice_name: string;
      parent: string;
    };
  }): Observable<boolean> {
    const serials = [];
    const query: { [key: string]: number } = {};

    job.data.payload.items.forEach(item => {
      if (query[item.item_code]) {
        query[item.item_code] += item.qty;
      } else {
        query[item.item_code] = item.qty;
      }

      if (item.has_serial_no) {
        if (typeof item.serial_no === 'string') {
          serials.push(...item.serial_no.split('\n'));
        } else {
          serials.push(...item.serial_no);
        }
      }
    });

    Object.keys(query).forEach(key => {
      query[`delivered_items_map.${key}`] = 0 - query[key];
      delete query[key];
    });

    this.salesInvoiceService
      .updateOne({ name: job.data.sales_invoice_name }, { $inc: query })
      .then(success => {})
      .catch(err => {});

    this.serialNoService
      .updateMany(
        { serial_no: { $in: serials } },
        {
          $unset: {
            'queue_state.delivery_note': null,
          },
        },
      )
      .then(success => {})
      .catch(err => {});

    return of(true);
  }

  createDeliveryNote(job: {
    payload: CreateDeliveryNoteInterface;
    token: any;
    settings: ServerSettings;
    sales_invoice_name: string;
    dataImport: DataImportSuccessResponse;
    parent: string;
    uuid: string;
  }) {
    let payload = job.payload;
    return of({}).pipe(
      switchMap(object => {
        payload = this.setCsvDefaults(payload, job.settings);
        const csvPayload = this.csvService.mapJsonToCsv(
          payload,
          CSV_TEMPLATE_HEADERS.delivery_note,
          CSV_TEMPLATE.delivery_note,
        );
        return this.importData.addDataImport(
          DELIVERY_NOTE_DOCTYPE,
          csvPayload,
          job.settings,
          job.token,
        );
      }),
      catchError(err => {
        if (
          (err && err.response && err.response.status === 403) ||
          (err &&
            err.response &&
            err.response.data &&
            err.response.data.exc &&
            err.response.data.exc.includes(VALIDATE_AUTH_STRING))
        ) {
          return this.tokenService.getUserAccessToken(job.token.email).pipe(
            mergeMap(token => {
              this.jobService.updateJobTokens(
                job.token.accessToken,
                token.accessToken,
              );
              job.token.accessToken = token.accessToken;
              return throwError(err);
            }),
            catchError(error => {
              return throwError(err);
            }),
          );
        }
        return throwError(err);
      }),
      retry(3),
      switchMap((success: DataImportSuccessResponse) => {
        job.dataImport = success;
        job.uuid = uuid();
        this.addToExportedQueue(job);
        return of({});
      }),
    );
  }

  setCsvDefaults(payload, settings: ServerSettings) {
    payload.naming_series = payload.naming_series
      ? payload.naming_series
      : DEFAULT_NAMING_SERIES.delivery_note;
    payload.price_list_currency = payload.price_list_currency
      ? payload.price_list_currency
      : DEFAULT_CURRENCY;
    payload.selling_price_list = payload.selling_price_list
      ? payload.selling_price_list
      : settings.sellingPriceList;
    payload.plc_conversion_rate = payload.plc_conversion_rate
      ? payload.plc_conversion_rate
      : 1;
    payload.status = payload.status ? payload.status : 'To Bill';
    return payload;
  }

  syncExistingSerials(
    job: {
      payload: CreateDeliveryNoteInterface;
      token: any;
      settings: ServerSettings;
      sales_invoice_name: string;
    },
    error,
  ): Observable<any> {
    const serials = [];
    job.payload.items.forEach(item => {
      if (item.has_serial_no) {
        if (typeof item.serial_no === 'string') {
          serials.push(...item.serial_no.split('\n'));
        } else {
          serials.push(...item.serial_no);
        }
      }
    });

    return this.jobHelper
      .validateFrappeSyncExistingSerials(
        serials,
        job.settings,
        job.token,
        job.sales_invoice_name,
      )
      .pipe(
        switchMap(data => {
          return of(data);
        }),
      );
  }

  linkDeliveryNote(
    payload: CreateDeliveryNoteInterface,
    response: SingleDoctypeResponseInterface,
    token: any,
    settings: ServerSettings,
    sales_invoice_name,
  ) {
    const serials = [];
    const items = [];
    payload.items.forEach(item => {
      if (item.has_serial_no) {
        this.serialNoService
          .updateMany(
            {
              serial_no: {
                $in:
                  typeof item.serial_no === 'string'
                    ? item.serial_no.split('\n')
                    : item.serial_no,
              },
            },
            {
              $set: {
                sales_invoice_name,
                'warranty.salesWarrantyDate': item.warranty_date,
                'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
                delivery_note: response.name,
                warehouse: payload.set_warehouse,
              },
              $unset: {
                'queue_state.delivery_note': null,
              },
            },
          )
          .then(success => {})
          .catch(err => {});
      }
    });

    response.items.filter(item => {
      if (item.serial_no) {
        serials.push(
          ...(typeof item.serial_no === 'string'
            ? item.serial_no.split('\n')
            : item.serial_no),
        );
      }
      items.push({
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        deliveredBy: token.fullName,
        deliveredByEmail: token.email,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
        serial_no: item.serial_no,
        expense_account: item.expense_account,
        cost_center: item.cost_center,
        delivery_note: response.name,
      });
      return;
    });

    this.salesInvoiceService
      .updateOne(
        { name: sales_invoice_name },
        {
          $push: {
            delivery_note_items: { $each: items },
            delivery_note_names: response.name,
          },
        },
      )
      .then(success => {})
      .catch(error => {});
  }

  resetSerialsMap(
    deliveryNotePayload: CreateDeliveryNoteInterface,
    sales_invoice_name: string,
  ) {
    const delivered_items_map = {};
    deliveryNotePayload.items.forEach(item => {
      delivered_items_map[item.item_code] = item.qty;
    });

    this.salesInvoiceService
      .findOne({
        name: sales_invoice_name,
      })
      .then(sales_invoice => {
        for (const key of Object.keys(delivered_items_map)) {
          if (sales_invoice.delivered_items_map[key]) {
            sales_invoice.delivered_items_map[key] -= delivered_items_map[key];
          } else {
            sales_invoice.delivered_items_map[key] = delivered_items_map[key];
          }
        }

        const status = this.getStatus(sales_invoice);
        this.salesInvoiceService
          .updateMany(
            { name: sales_invoice_name },
            {
              $set: {
                status,
                delivered_items_map: sales_invoice.delivered_items_map,
              },
            },
          )
          .then(success => {})
          .catch(error => {});
      })
      .catch(error => {});
  }

  getStatus(sales_invoice: SalesInvoice) {
    let total = 0;
    for (const key of Object.keys(sales_invoice.delivered_items_map)) {
      total += sales_invoice.delivered_items_map[key];
    }
    if (total === sales_invoice.total_qty) return COMPLETED_STATUS;
    else return TO_DELIVER_STATUS;
  }

  addToQueueNow(data: {
    payload: CreateDeliveryNoteInterface;
    token: any;
    settings: ServerSettings;
    sales_invoice_name: string;
    type?: string;
    parent?: string;
    status?: string;
  }) {
    data.type = CREATE_DELIVERY_NOTE_JOB;
    data.parent = data.sales_invoice_name;
    data.status = AGENDA_JOB_STATUS.in_queue;
    data.payload.items.forEach(element => {
      if (typeof element.serial_no !== 'string') {
        try {
          element.serial_no = element.serial_no.join('\n');
        } catch {}
      }
    });
    return this.agenda.now(FRAPPE_QUEUE_JOB, data);
  }

  syncImport(job: {
    payload: DataImportSuccessResponse;
    uuid: string;
    type: string;
    settings: ServerSettings;
    token: TokenCache;
  }) {
    return this.importData.syncImport(job, DELIVERY_NOTE_DOCTYPE).pipe(
      switchMap(
        (response: {
          parent_job: { value: { data: any } };
          state: { doc: any };
        }) => {
          const parent_data = response.parent_job.value.data;
          this.linkDeliveryNote(
            parent_data.payload,
            response.state.doc,
            job.token,
            job.settings,
            parent_data.parent,
          );
          return of();
        },
      ),
    );
  }

  addToExportedQueue(job: {
    dataImport: DataImportSuccessResponse;
    uuid: string;
    settings: ServerSettings;
    token: any;
    parent: string;
  }) {
    const job_data = {
      payload: job.dataImport,
      uuid: job.uuid,
      type: SYNC_DELIVERY_NOTE_JOB,
      settings: job.settings,
      token: job.token,
      parent: job.parent,
    };
    return this.agenda.now(FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB, job_data);
  }
}
