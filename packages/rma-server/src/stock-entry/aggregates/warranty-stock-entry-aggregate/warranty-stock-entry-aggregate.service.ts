import {
  Injectable,
  NotImplementedException,
  HttpService,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';
import {
  STOCK_ENTRY,
  STOCK_ENTRY_STATUS,
} from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import { DateTime } from 'luxon';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import {
  ERPNEXT_STOCK_ENTRY_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { WarrantyStockEntryDto } from '../../../stock-entry/stock-entry/warranty-stock-entry-dto';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import {
  EventType,
  SerialNoHistory,
} from '../../../serial-no/entity/serial-no-history/serial-no-history.entity';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import { StockEntry } from '../../../stock-entry/stock-entry/stock-entry.entity';

@Injectable()
export class WarrantyStockEntryAggregateService {
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly settingService: SettingsService,
    private readonly serialService: SerialNoService,
    private readonly http: HttpService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
  ) { }

  createStockEntry(payload: WarrantyStockEntryDto, res, req) {
    return this.stockEntryPolicies.validateStockEntry(payload, req).pipe(
      switchMap(valid => {
        return this.settingService.find();
      }),
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        stockEntry.stock_voucher_number = res.name;
        stockEntry.status = STOCK_ENTRY_STATUS.delivered;
        return from(this.stockEntryService.create(stockEntry));
      }),
    );
  }

  createERPStockEntry(payload, req) {
    let setting: any;
    return this.settingService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException());
        }
        setting = settings;
        const url = `${settings.authServerURL}${ERPNEXT_STOCK_ENTRY_ENDPOINT}`;
        const body = this.mapWarrantyStock(payload);
        return this.http.post(url, body, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(res => {
        return this.createStockEntry(payload, res, req);
      }),
      switchMap(() => {
        return this.updateSerialItem(payload.items, payload, setting);
      }),
      catchError(err => {
        if (err.response && err.response.data) {
          return throwError(new BadRequestException(err.response.data.exc));
        }
        return throwError(err);
      }),
    );
  }

  updateSerialItem(items: any[], payload, settings) {
    this.serialService
      .updateOne(
        { serial_no: items[0].serial_no },
        {
          $set: {
            customer: payload.customer,
            'warranty.salesWarrantyDate': payload.salesWarrantyDate,
            'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
            sales_invoice_name: payload.sales_invoice_name,
          },
        },
      )
      .then(success => {
        return this.serialNoHistoryService.create({
          ...items[0],
          eventDate: new Date(),
          eventType: EventType.UpdateSerial,
        } as SerialNoHistory);
      })
      .then(updated => { })
      .catch(error => { });
    return of()
  }
  mapWarrantyStock(payload) {
    payload.docstatus = 1;
    payload.items.forEach(item => {
      item.serial_no = item.serial_no[0];
    });
    return payload;
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

  removeStockEntry(stock_entry_name, req) {
    let set: any;
    return this.settingService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException());
        }
        set = settings;
        const url = `${settings.authServerURL}${ERPNEXT_STOCK_ENTRY_ENDPOINT}/${stock_entry_name}`;
        return this.http.get(url, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(response => {
        if (!response) {
          return throwError(new NotFoundException());
        }
        const url = `${set.authServerURL}${ERPNEXT_STOCK_ENTRY_ENDPOINT}/${stock_entry_name}`;
        response.docstatus = 2;
        return this.http.put(url, response, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(res => {
        return this.stockEntryService.deleteOne({
          stock_voucher_number: res.name,
        });
      }),
    );
  }

  returnStock(payload, clientHttpRequest) {
    const delivery_note = payload.delivery_note;
    let set;
    return this.settingService.find().pipe(
      switchMap(setting => {
        if (!setting.authServerURL) {
          return throwError(new NotImplementedException());
        }
        set = setting;
        return this.http.get(
          `${setting.authServerURL}/${POST_DELIVERY_NOTE_ENDPOINT}/${delivery_note}`,
          {
            headers: this.settingService.getAuthorizationHeaders(
              clientHttpRequest.token,
            ),
          },
        );
      }),
      map(res => res.data.data),
      switchMap(res => {
        const body = this.mapDeliveryNote(payload, res);
        return this.http.post(
          `${set.authServerURL}/${POST_DELIVERY_NOTE_ENDPOINT}`,
          body,
          {
            headers: this.settingService.getAuthorizationHeaders(
              clientHttpRequest.token,
            ),
          },
        );
      }),
      switchMap(() => {
        return this.serialService.updateOne(
          { serial_no: payload.items[0].serial_no[0] },
          {
            $unset: {
              customer: undefined,
              'warranty.salesWarrantyDate': undefined,
              'warranty.soldOn': undefined,
              delivery_note: undefined,
              sales_invoice_name: undefined,
            },
          },
        );
      }),
    );
  }

  mapDeliveryNote(payload, res) {
    res.is_return = 1;
    res.docstatus = 1;
    res.return_against = res.name;
    res.items = [];
    res.items[0] = payload.items[0];
    res.items[0].serial_no = payload.items[0].serial_no[0];
    res.items[0].stock_qty = payload.items[0].qty;
    return res;
  }
}
