import {
  Injectable,
  NotImplementedException,
  HttpService,
  NotFoundException,
} from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { switchMap, map } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';
import {
  STOCK_ENTRY,
  STOCK_ENTRY_STATUS,
} from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import { DateTime } from 'luxon';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { POST_DELIVERY_NOTE_ENDPOINT } from '../../../constants/routes';
import { WarrantyStockEntryDto } from '../../../stock-entry/stock-entry/warranty-stock-entry-dto';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { StockEntry } from '../../../stock-entry/stock-entry/stock-entry.entity';

@Injectable()
export class WarrantyStockEntryAggregateService {
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly settingService: SettingsService,
    private readonly serialService: SerialNoService,
    private readonly http: HttpService,
  ) {}

  createStockEntry(payload: WarrantyStockEntryDto, req) {
    let warrantyPayload: any = {};
    let serverSettings;
    const serial_no = payload.replacedSerial;
    Object.assign(warrantyPayload, payload);
    warrantyPayload.items[0].serial_no = warrantyPayload.items[0].serial_no.split();
    return this.stockEntryPolicies
      .validateStockEntry(warrantyPayload, req)
      .pipe(
        switchMap(valid => {
          return this.settingService.find();
        }),
        switchMap(settings => {
          const stockEntry = this.setStockEntryDefaults(payload, req, settings);
          warrantyPayload = stockEntry;
          serverSettings = settings;
          return from(this.stockEntryService.create(stockEntry));
        }),
        switchMap(() => {
          Object.assign(warrantyPayload, payload);
          warrantyPayload.status = undefined;
          return this.createERPStockEntry(warrantyPayload, req, serverSettings);
        }),
        map(res => res.data.data),
        switchMap(erpDeliveryNote => {
          return this.updateStockEntry(erpDeliveryNote, warrantyPayload);
        }),
        switchMap(payloadObject => {
          if (warrantyPayload.items[0].has_serial_no) {
            payloadObject.payload.delivery_note =
              payloadObject.erpDeliveryNote.delivery_note;
            return this.updateSerialItem(
              serial_no,
              payloadObject.payload,
              serverSettings,
            );
          }
          return of({});
        }),
      );
  }

  createERPStockEntry(payload, req, settings) {
    const url = `${settings.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`;
    const body = this.mapErpItem(payload);
    return this.http.post(url, body, {
      headers: this.settingService.getAuthorizationHeaders(req.token),
    });
  }

  updateStockEntry(erpDeliveryNote, payload) {
    return from(
      this.stockEntryService.updateOne(
        { uuid: payload.uuid },
        {
          $set: { stock_voucher_number: erpDeliveryNote.name },
        },
      ),
    ).pipe(
      switchMap(res => {
        return of({ erpDeliveryNote, payload });
      }),
    );
  }

  updateSerialItem(serial_no, payload, settings) {
    return from(
      this.serialService.updateOne(
        { serial_no },
        {
          $set: {
            customer: payload.customer,
            'warranty.salesWarrantyDate': payload.salesWarrantyDate,
            'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
            sales_invoice_name: payload.sales_invoice_name,
            delivery_note: payload.delivery_note,
          },
        },
      ),
    );
  }

  mapErpItem(payload) {
    const erpPayload = {} as any;
    Object.assign(erpPayload, payload);
    erpPayload.has_serial_no = 0;
    erpPayload.docstatus = 1;
    erpPayload.items.forEach(item => {
      item.serial_no = undefined;
      if (item.stock_entry_type === 'Returned') {
        erpPayload.is_return = 1;
      }
    });
    return erpPayload;
  }

  setStockEntryDefaults(
    payload: WarrantyStockEntryDto,
    clientHttpRequest,
    settings: ServerSettings,
  ): StockEntry {
    const stockEntry = new StockEntry();
    Object.assign(stockEntry, payload);
    stockEntry.uuid = uuidv4();
    stockEntry.doctype = STOCK_ENTRY;
    stockEntry.createdOn = payload.posting_date;
    stockEntry.createdAt = new DateTime(settings.timeZone).toJSDate();
    stockEntry.createdByEmail = clientHttpRequest.token.email;
    stockEntry.createdBy = clientHttpRequest.token.fullName;
    stockEntry.status = STOCK_ENTRY_STATUS.in_transit;
    stockEntry.isSynced = false;
    stockEntry.inQueue = true;
    stockEntry.docstatus = 1;
    return stockEntry;
  }

  retrieveStockEntry(warrantyClaimUuid: string) {
    return from(this.stockEntryService.findOne(warrantyClaimUuid));
  }

  removeStockEntry(stockEntry, req) {
    let set: any;
    let updatedDeliveryNote: any;
    return this.settingService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException());
        }
        set = settings;
        const url = `${settings.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}/${stockEntry.stock_voucher_number}`;
        return this.http.get(url, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(deliveryNoteBody => {
        const body = this.mapEditDeliveryNote(deliveryNoteBody);
        return this.http
          .post(`${set.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`, body, {
            headers: this.settingService.getAuthorizationHeaders(req.token),
          })
          .pipe(
            map(res => res.data.data),
            switchMap(deliveryData => {
              return of({ deliveryData, deliveryNoteBody });
            }),
          );
      }),
      switchMap(response => {
        updatedDeliveryNote = response.deliveryData;
        if (!response.deliveryNoteBody) {
          return throwError(new NotFoundException());
        }
        const url = `${set.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}/${stockEntry.stock_voucher_number}`;
        response.deliveryNoteBody.docstatus = 2;
        response.deliveryNoteBody.items.forEach(item => {
          item.docstatus = 2;
          item.actual_qty += 1;
        });
        return this.http.put(url, response.deliveryNoteBody, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(canceledDeliveryNote => {
        return this.stockEntryService.deleteOne({
          stock_voucher_number: canceledDeliveryNote.name,
        });
      }),
      switchMap(() => {
        if (stockEntry.stock_entry_type === 'Delivered') {
          return from(
            this.serialService.updateOne(
              { serial_no: stockEntry.items[0]?.serial_no[0] },
              {
                $unset: {
                  customer: undefined,
                  'warranty.salesWarrantyDate': undefined,
                  'warranty.soldOn': undefined,
                  delivery_note: undefined,
                  sales_invoice_name: undefined,
                },
              },
            ),
          );
        }
        if (stockEntry.stock_entry_type === 'Returned') {
          return from(
            this.serialService.updateOne(
              { serial_no: stockEntry.items[0]?.serial_no[0] },
              {
                $set: {
                  delivery_note: updatedDeliveryNote.name,
                },
              },
            ),
          );
        }
        return of();
      }),
    );
  }

  returnStock(payload, clientHttpRequest) {
    const serial_no = payload.items[0].serial_no;
    let delivery_note = payload.delivery_note;
    let set;
    return this.settingService.find().pipe(
      switchMap(setting => {
        if (!setting.authServerURL) {
          return throwError(new NotImplementedException());
        }
        set = setting;
        if (payload.items[0].has_serial_no) {
          return this.http.get(
            `${setting.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}/${delivery_note}`,
            {
              headers: this.settingService.getAuthorizationHeaders(
                clientHttpRequest.token,
              ),
            },
          );
        }
        return of({ data: { data: {} } });
      }),
      map(res => res.data.data),
      switchMap(res => {
        const body = this.mapDeliveryNote(payload, res);
        body.items[0].serial_no = undefined;
        return this.http.post(
          `${set.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`,
          body,
          {
            headers: this.settingService.getAuthorizationHeaders(
              clientHttpRequest.token,
            ),
          },
        );
      }),
      map(res => res.data.data),
      switchMap(res => {
        const stockEntry = this.setStockEntryDefaults(
          payload,
          clientHttpRequest,
          set,
        );
        stockEntry.status = STOCK_ENTRY_STATUS.returned;
        stockEntry.stock_voucher_number = res.name;
        delivery_note = res.name;
        return from(this.stockEntryService.create(stockEntry));
      }),
      switchMap(() => {
        if (payload.items[0].has_serial_no) {
          return this.serialService.updateOne(
            { serial_no },
            {
              $set: {
                delivery_note,
              },
            },
          );
        }
      }),
    );
  }

  mapDeliveryNote(payload, res) {
    res.is_return = 1;
    res.docstatus = 1;
    res.return_against = res.name;
    res.items = [];
    res.items[0] = payload.items[0];
    res.items[0].stock_qty = payload.items[0].stock_qty;
    return res;
  }

  mapEditDeliveryNote(deliveryNoteBody) {
    if (deliveryNoteBody.is_return) {
      deliveryNoteBody.is_return = 0;
    } else {
      deliveryNoteBody.is_return = 1;
    }
    deliveryNoteBody.total_qty = -deliveryNoteBody.total_qty;
    deliveryNoteBody.items[0].qty = -deliveryNoteBody.items[0].qty;
    deliveryNoteBody.items[0].stock_qty = -deliveryNoteBody.items[0].stock_qty;
    deliveryNoteBody.items[0].actual_qty += deliveryNoteBody.total_qty;
    return deliveryNoteBody;
  }
}
