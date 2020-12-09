import {
  Injectable,
  NotImplementedException,
  HttpService,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { switchMap, map, toArray, mergeMap } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';
import {
  DEFAULT_NAMING_SERIES,
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
import {
  StockEntryDto,
  StockEntryItemDto,
} from 'src/stock-entry/stock-entry/stock-entry-dto';

@Injectable()
export class WarrantyStockEntryAggregateService {
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly settingService: SettingsService,
    private readonly serialService: SerialNoService,
    private readonly http: HttpService,
  ) {}

  createStockEntry(payload: WarrantyStockEntryDto, req) {
    const warrantyPayload: any = {};
    let serverSettings;
    Object.assign(warrantyPayload, payload);
    warrantyPayload.items[0].serial_no = warrantyPayload.items[0].serial_no.split();
    return this.validateStockEntry(warrantyPayload, req).pipe(
      switchMap(valid => {
        return this.settingService.find();
      }),
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        serverSettings = settings;
        return from(this.stockEntryService.create(stockEntry));
      }),
      map(res => res.ops[0]),
      switchMap(stockEntry => {
        warrantyPayload.uuid = stockEntry.uuid;
        warrantyPayload.status = undefined;
        return this.createERPStockEntry(warrantyPayload, req, serverSettings);
      }),
      map(res => res.data.data),
      switchMap(erpDeliveryNote => {
        return this.updateStockEntry(erpDeliveryNote, warrantyPayload);
      }),
      switchMap(payloadObject => {
        if (
          warrantyPayload.items[0].excel_serials &&
          payloadObject.payload.stock_entry_type === 'Delivered'
        ) {
          payloadObject.payload.retrieve_delivery_note =
            payloadObject.payload.delivery_note;
          payloadObject.payload.delivery_note =
            payloadObject.erpDeliveryNote.name;
          return this.updateSerialItem(payloadObject.payload, serverSettings);
        }
        payloadObject.payload.retrieve_delivery_note =
          payloadObject.payload.delivery_note;
        payloadObject.payload.delivery_note =
          payloadObject.erpDeliveryNote.name;
        return from(
          this.serialService.updateOne(
            { serial_no: payloadObject.payload.items[0].excel_serials },
            {
              $set: {
                retrieve_delivery_note:
                  payloadObject.payload.retrieve_delivery_note,
                delivery_note: payloadObject.erpDeliveryNote.name,
              },
            },
          ),
        );
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

  getSerialItem(serial_no) {
    return from(this.serialService.findOne({ serial_no }));
  }

  updateSerialItem(payload, settings) {
    return this.getSerialItem(payload.items[0].replacedSerial).pipe(
      switchMap(serialItem => {
        return from(
          this.serialService.updateOne(
            { serial_no: payload.items[0].excel_serials },
            {
              $set: {
                customer: serialItem.customer,
                'warranty.salesWarrantyDate':
                  serialItem.warranty.salesWarrantyDate,
                'warranty.soldOn': new DateTime(settings.timeZone).toJSDate(),
                sales_invoice_name: serialItem.sales_invoice_name,
                delivery_note: payload.delivery_note,
              },
            },
          ),
        );
      }),
    );
  }

  mapErpItem(payload) {
    const erpPayload = {} as any;
    Object.assign(erpPayload, payload);
    erpPayload.has_serial_no = 0;
    erpPayload.docstatus = 1;
    erpPayload.items.forEach(item => {
      item.excel_serials = item.serial_no[0];
      item.serial_no = undefined;
      if (item.stock_entry_type === 'Returned') {
        erpPayload.naming_series =
          DEFAULT_NAMING_SERIES.warranty_delivery_return;
        erpPayload.is_return = 1;
      }
      if (item.stock_entry_type === 'Delivered')
        erpPayload.naming_series = DEFAULT_NAMING_SERIES.warranty_delivery_note;
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
      switchMap(response => {
        if (!response) {
          return throwError(new NotFoundException());
        }
        const url = `${set.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}/${stockEntry.stock_voucher_number}`;
        response.docstatus = 2;
        response.items.forEach(item => {
          item.docstatus = 2;
        });
        return this.http.put(url, response, {
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
        return from(
          this.serialService.findOne({
            serial_no: stockEntry.items[0]?.serial_no[0],
          }),
        );
      }),
      switchMap(serialItem => {
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
                  delivery_note: serialItem.retrieve_delivery_note,
                },
                $unset: {
                  retrieve_delivery_note: undefined,
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
    let serverSettings;
    return this.settingService.find().pipe(
      switchMap(setting => {
        if (!setting.authServerURL) {
          return throwError(new NotImplementedException());
        }
        serverSettings = setting;
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
          `${serverSettings.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`,
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
          serverSettings,
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

  validateStockEntry(payload: StockEntryDto, clientHttpRequest) {
    return this.settingService.find().pipe(
      switchMap(settings => {
        return this.validateStockSerials(
          payload.items,
          settings,
          clientHttpRequest,
        );
      }),
    );
  }

  validateStockSerials(
    items: StockEntryItemDto[],
    settings,
    clientHttpRequest,
  ) {
    return from(items).pipe(
      mergeMap(item => {
        if (!item.has_serial_no) {
          return of(true);
        }
        return from(
          this.serialService.count({
            serial_no: { $in: item.serial_no },
            item_code: item.item_code,
            $or: [
              {
                $or: [
                  { warehouse: item.s_warehouse },
                  {
                    'queue_state.purchase_receipt.warehouse': item.s_warehouse,
                  },
                ],
              },
              {
                $or: [
                  {
                    'warranty.soldOn': { $exists: false },
                    'queue_state.delivery_note': { $exists: false },
                  },
                  {
                    'warranty.claim_no': { $exists: true },
                  },
                ],
              },
            ],
          }),
        ).pipe(
          mergeMap(count => {
            if (count === item.serial_no.length) {
              return of(true);
            }
            return throwError(
              new BadRequestException(
                `Expected ${item.serial_no.length} serials for Item: ${item.item_name} at warehouse: ${item.s_warehouse}, found ${count}.`,
              ),
            );
          }),
        );
      }),
      toArray(),
      switchMap(isValid => {
        return of(true);
      }),
    );
  }
}
