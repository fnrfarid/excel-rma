import { Injectable, Inject, HttpService } from '@nestjs/common';
import { switchMap, mergeMap, catchError, retry, map } from 'rxjs/operators';
import {
  VALIDATE_AUTH_STRING,
  COMPLETED_STATUS,
  TO_DELIVER_STATUS,
  CREATE_DELIVERY_NOTE_JOB,
  AGENDA_JOB_STATUS,
  FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB,
  DELIVERY_NOTE_DOCTYPE,
  SYNC_DELIVERY_NOTE_JOB,
} from '../../../constants/app-strings';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { of, throwError, Observable, from } from 'rxjs';
import { CreateDeliveryNoteInterface } from '../../entity/delivery-note-service/create-delivery-note-interface';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DeliveryNoteResponseInterface } from '../../entity/delivery-note-service/delivery-note-response-interface';
import { DateTime } from 'luxon';
import { SalesInvoice } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { FRAPPE_QUEUE_JOB } from '../../../constants/app-strings';
import Agenda = require('agenda');
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { AgendaJobService } from '../../../job-queue/entities/agenda-job/agenda-job.service';
import { DeliveryNoteJobHelperService } from '../delivery-note-job-helper/delivery-note-job-helper.service';
import { JsonToCsvParserService } from '../../../sync/service/data-import/json-to-csv-parser.service';
import {
  DataImportService,
  DataImportSuccessResponse,
} from '../../../sync/service/data-import/data-import.service';
import * as uuid from 'uuid/v4';
import {
  DATA_IMPORT_API_ENDPOINT,
  LIST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { DataImportSuccessResponseInterface } from '../../../sync/service/data-import/data-import.interface';
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
    private readonly csvService: JsonToCsvParserService,
    private readonly importData: DataImportService,
    private readonly http: HttpService,
    private readonly clientToken: ClientTokenManagerService,
  ) {}

  execute(job) {
    return this.createDeliveryNote(job.attrs.data);
  }

  resetState(job: {
    payload: CreateDeliveryNoteInterface;
    token: any;
    settings: ServerSettings;
    sales_invoice_name: string;
  }) {
    return;
  }

  createDeliveryNote(job: {
    payload: CreateDeliveryNoteInterface;
    token: any;
    settings: ServerSettings;
    sales_invoice_name: string;
    dataImport: DataImportSuccessResponse;
    uuid: string;
  }) {
    let payload = job.payload;
    return of({}).pipe(
      switchMap(object => {
        payload = this.setCsvDefaults(payload, job.settings);
        const csvPayload = this.csvService.mapJsonToCsv(payload);
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
        if (
          (err &&
            err.response &&
            err.response.data &&
            err.response.data.exc &&
            (err.response.data.exc.includes('SerialNoWarehouseError') ||
              err.response.data.exc.includes(
                'does not belong to Warehouse',
              ))) ||
          err.response.data.exc.includes('BaseDocument') ||
          err.response.data.exc.includes('ValueError')
        ) {
          return this.syncExistingSerials(job, err);
        }
        // new approach, we wont reset state let the user retry it from agenda UI.
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
      : 'SDR-';
    payload.price_list_currency = payload.price_list_currency
      ? payload.price_list_currency
      : 'BDT';
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
    response: DeliveryNoteResponseInterface,
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
                'warranty.salesWarrantyDate': item.warranty_date,
                'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
                delivery_note: response.name,
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
          $push: { delivery_note_items: { $each: items } },
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
  }) {
    const state: any = {};
    return this.clientToken.getServiceAccountApiHeaders().pipe(
      switchMap(headers => {
        state.headers = headers;
        return this.http.get(
          job.settings.authServerURL +
            DATA_IMPORT_API_ENDPOINT +
            `/${job.payload.dataImportName}`,
          { headers },
        );
      }),
      map(data => data.data.data),
      switchMap((response: DataImportSuccessResponseInterface) => {
        if (response.import_status === 'Successful') {
          const parsed_response = JSON.parse(response.log_details);
          const link = parsed_response.messages[0].link.split('/');
          const delivery_note = link[link.length - 1];
          return of(delivery_note);
        }
        if (
          response.import_status === 'Pending' ||
          response.import_status === 'In Progress'
        ) {
          return throwError('Delivery Note is in queue');
        }
        return throwError(response);
      }),
      switchMap(delivery_note => {
        return this.http.get(
          job.settings.authServerURL +
            LIST_DELIVERY_NOTE_ENDPOINT +
            delivery_note,
          { headers: state.headers },
        );
      }),
      map(data => data.data.data),
      switchMap((delivery_note_response: DeliveryNoteResponseInterface) => {
        state.delivery_note_response = delivery_note_response;
        return from(this.jobService.findOne({ 'data.uuid': job.uuid }));
      }),
      switchMap(parent_job => {
        const parent_data = parent_job.data;
        this.linkDeliveryNote(
          parent_data.payload,
          state.delivery_note_response,
          parent_data.token,
          job.settings,
          parent_data.parent,
        );
        return of();
      }),
      retry(2),
    );
  }

  addToExportedQueue(job: {
    dataImport: DataImportSuccessResponse;
    uuid: string;
    settings: ServerSettings;
  }) {
    const job_data = {
      payload: job.dataImport,
      uuid: job.uuid,
      type: SYNC_DELIVERY_NOTE_JOB,
      settings: job.settings,
    };
    return this.agenda.now(FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB, job_data);
  }
}
