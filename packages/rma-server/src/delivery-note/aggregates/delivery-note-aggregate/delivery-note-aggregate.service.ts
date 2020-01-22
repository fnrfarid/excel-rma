import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  ERPNEXT_API_WAREHOUSE_ENDPOINT,
  LIST_DELIVERY_NOTE_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { PLEASE_RUN_SETUP } from '../../../constants/messages';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  DELIVERY_NOTE_LIST_FIELD,
} from '../../../constants/app-strings';
import { AssignSerialDto } from '../../../serial-no/entity/serial-no/assign-serial-dto';
import {
  CreateDeliveryNoteInterface,
  CreateDeliveryNoteItemInterface,
} from '../../../delivery-note/entity/delivery-note-service/create-delivery-note-interface';
import { DeliveryNoteResponseInterface } from '../../entity/delivery-note-service/delivery-note-response-interface';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';

@Injectable()
export class DeliveryNoteAggregateService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly serialNoService: SerialNoService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly salesInvoiceService: SalesInvoiceService,
  ) {}

  listDeliveryNote(offset, limit, req) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
        }
        const headers = this.getAuthorizationHeaders(req.token);
        const params = {
          filters: JSON.stringify([['is_return', '=', '1']]),
          fields: JSON.stringify(DELIVERY_NOTE_LIST_FIELD),
          limit_page_length: Number(limit),
          limit_start: Number(offset),
        };
        return this.http
          .get(settings.authServerURL + LIST_DELIVERY_NOTE_ENDPOINT, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.data.data);
            }),
          );
      }),
      catchError(error => {
        return throwError(new BadRequestException(error));
      }),
    );
  }

  getAuthorizationHeaders(token) {
    return {
      [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
    };
  }

  relayListWarehouses(query) {
    return this.clientToken.getClientToken().pipe(
      switchMap(token => {
        return this.settingsService.find().pipe(
          switchMap(settings => {
            const url = settings.authServerURL + ERPNEXT_API_WAREHOUSE_ENDPOINT;
            return this.http
              .get(url, {
                headers: this.getAuthorizationHeaders(token),
                params: query,
              })
              .pipe(map(res => res.data));
          }),
        );
      }),
    );
  }

  createDeliveryNote(assignPayload: AssignSerialDto, clientHttpRequest) {
    return this.settingsService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings) {
            return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
          }
          const deliveryNoteBody = this.mapCreateDeliveryNote(assignPayload);
          return this.http.post(
            settings.authServerURL + POST_DELIVERY_NOTE_ENDPOINT,
            deliveryNoteBody,
            { headers: this.getAuthorizationHeaders(clientHttpRequest.token) },
          );
        }),
      )
      .pipe(map(data => data.data.data))
      .pipe(
        switchMap((response: DeliveryNoteResponseInterface) => {
          const serials = [];
          const items = [];
          response.items.filter(item => {
            serials.push(item.serial_no);
            items.push({
              item_code: item.item_code,
              item_name: item.item_name,
              description: item.description,
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
            .updateMany(
              { name: assignPayload.sales_invoice_name },
              { $push: { delivery_note_items: { $each: items } } },
            )
            .then(success => {})
            .catch(error => {});
          return of({});
        }),
        catchError(err => {
          return throwError(
            new BadRequestException(err.response ? err.response.data.exc : err),
          );
        }),
      );
  }

  mapCreateDeliveryNote(
    assignPayload: AssignSerialDto,
  ): CreateDeliveryNoteInterface {
    const deliveryNoteBody: CreateDeliveryNoteInterface = {};
    deliveryNoteBody.docstatus = 1;
    deliveryNoteBody.posting_date = assignPayload.posting_date;
    deliveryNoteBody.posting_time = assignPayload.posting_time;
    deliveryNoteBody.is_return = 0;
    deliveryNoteBody.set_warehouse = assignPayload.set_warehouse;
    deliveryNoteBody.customer = assignPayload.customer;
    deliveryNoteBody.company = assignPayload.company;
    deliveryNoteBody.total_qty = assignPayload.total_qty;
    deliveryNoteBody.total = assignPayload.total;
    deliveryNoteBody.items = this.mapSerialsFromItem(
      assignPayload.items,
      assignPayload,
    );
    // deliveryNoteBody.pricing_rules = []
    // deliveryNoteBody.packed_items = []
    // deliveryNoteBody.taxes = []
    // deliveryNoteBody.sales_team = []
    return deliveryNoteBody;
  }

  mapSerialsFromItem(
    items: CreateDeliveryNoteItemInterface[],
    assignPayload: AssignSerialDto,
  ) {
    items.filter(element => {
      element.against_sales_invoice = assignPayload.sales_invoice_name;
      element.serial_no = element.serial_no.join('\n');
    });
    return items;
  }
}
