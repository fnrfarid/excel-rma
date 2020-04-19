import { Injectable, HttpService, Inject } from '@nestjs/common';
import { switchMap, mergeMap, catchError, retry, map } from 'rxjs/operators';
import {
  VALIDATE_AUTH_STRING,
  COMPLETED_STATUS,
  TO_DELIVER_STATUS,
  CREATE_DELIVERY_NOTE_JOB,
} from '../../../constants/app-strings';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { of, throwError } from 'rxjs';
import { POST_DELIVERY_NOTE_ENDPOINT } from '../../../constants/routes';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { CreateDeliveryNoteInterface } from '../../entity/delivery-note-service/create-delivery-note-interface';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DeliveryNoteResponseInterface } from '../../entity/delivery-note-service/delivery-note-response-interface';
import { DateTime } from 'luxon';
import { SalesInvoice } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { FRAPPE_QUEUE_JOB } from '../../../constants/app-strings';
import Agenda = require('agenda');
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const CREATE_STOCK_ENTRY_JOB = 'CREATE_STOCK_ENTRY_JOB';

@Injectable()
export class DeliveryNoteJobService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly serialNoService: SerialNoService,
    private readonly settingsService: SettingsService,
    private readonly salesInvoiceService: SalesInvoiceService,
  ) {}

  execute(job) {
    return this.createDeliveryNote(job.attrs.data);
  }

  failureCallback(job) {
    return;
  }

  createDeliveryNote(job: {
    payload: CreateDeliveryNoteInterface;
    token: any;
    settings: ServerSettings;
    sales_invoice_name: string;
  }) {
    const payload = job.payload;
    return of({}).pipe(
      mergeMap(object => {
        //
        return this.http.post(
          job.settings.authServerURL + POST_DELIVERY_NOTE_ENDPOINT,
          payload,
          { headers: this.settingsService.getAuthorizationHeaders(job.token) },
        );
      }),
      catchError(err => {
        if (
          (err.response && err.response.status === 403) ||
          (err.response.data &&
            err.response.data.exc &&
            err.response.data.exc.includes(VALIDATE_AUTH_STRING))
        ) {
          return this.tokenService.getUserAccessToken(job.token.email).pipe(
            mergeMap(token => {
              job.token.accessToken = token.accessToken;
              return throwError(err);
            }),
          );
        } else {
          this.resetSerialsMap(job.payload, job.sales_invoice_name);
          return of({ data: { data: false } });
        }
      }),
      retry(3),
      map(data => data.data.data),
      switchMap(success => {
        if (success) {
          this.linkDeliveryNote(
            payload,
            success,
            job.token,
            job.settings,
            job.sales_invoice_name,
          );
        }
        return of({});
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
            { serial_no: { $in: item.serial_no.split('\n') } },
            {
              $set: {
                'warranty.salesWarrantyDate': item.warranty_date,
                'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
              },
            },
          )
          .then(success => {})
          .catch(err => {});
      }
    });

    response.items.filter(item => {
      if (item.serial_no) {
        serials.push(...item.serial_no.split('\n'));
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
    this.serialNoService
      .updateMany(
        { serial_no: { $in: serials } },
        { $set: { delivery_note: response.name } },
      )
      .then(success => {})
      .catch(error => {});

    this.salesInvoiceService
      .findOne({
        name: sales_invoice_name,
      })
      .then(sales_invoice => {
        this.salesInvoiceService
          .updateMany(
            { name: sales_invoice_name },
            {
              $push: { delivery_note_items: { $each: items } },
            },
          )
          .then(success => {})
          .catch(error => {});
      })
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
  }) {
    data.type = CREATE_DELIVERY_NOTE_JOB;
    data.payload.items.forEach(element => {
      if (typeof element.serial_no !== 'string') {
        try {
          element.serial_no = element.serial_no.join('\n');
        } catch {}
      }
    });
    this.agenda
      .now(FRAPPE_QUEUE_JOB, data)
      .then(success => {})
      .catch(err => {});
  }
}