import {
  Injectable,
  NotImplementedException,
  HttpService,
  BadRequestException,
} from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { from, throwError } from 'rxjs';
import {
  STOCK_ENTRY,
  STOCK_ENTRY_STATUS,
} from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import { DateTime } from 'luxon';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { ERPNEXT_STOCK_ENTRY_ENDPOINT } from '../../../constants/routes';
import { WarrantyStockEntryDto } from '../../../stock-entry/stock-entry/warranty-stock-entry-dto';

@Injectable()
export class WarrantyStockEntryAggregateService {
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly settingService: SettingsService,
    private readonly http: HttpService,
  ) {}

  createStockEntry(payload: WarrantyStockEntryDto, req) {
    return this.stockEntryPolicies.validateStockEntry(payload, req).pipe(
      switchMap(valid => {
        return this.settingService.find();
      }),
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        return from(this.stockEntryService.create(stockEntry)).pipe(
          switchMap(success => {
            payload.docstatus = 1;
            payload.uuid = stockEntry.uuid;
            return this.createERPStockEntry(payload, req);
          }),
        );
      }),
    );
  }

  createERPStockEntry(payload, req) {
    return this.settingService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException());
        }
        const url = `${settings.authServerURL}${ERPNEXT_STOCK_ENTRY_ENDPOINT}`;
        const body = this.mapWarrantyStock(payload);
        return this.http.post(url, body, {
          headers: this.settingService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
      switchMap(res => {
        return this.stockEntryService.updateOne(
          { uuid: payload.uuid },
          { $set: { stock_voucher_number: res.name } },
        );
      }),
      catchError(err => {
        if (err.response && err.response.data) {
          return throwError(new BadRequestException(err.response.data.exc));
        }
        return throwError(err);
      }),
    );
  }

  mapWarrantyStock(payload) {
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
}
