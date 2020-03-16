import { Injectable, HttpService } from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryDto } from '../../stock-entry/stock-entry-dto';
import { StockEntryPoliciesService } from '../../stock-entry-policies/stock-entry-policies.service';
import { switchMap } from 'rxjs/operators';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { STOCK_ENTRY_API_ENDPOINT } from '../../../constants/routes';
import { from } from 'rxjs';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { STOCK_ENTRY } from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

@Injectable()
export class StockEntryAggregateService {
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
    private readonly errorLogService: ErrorLogService,
    private readonly serialNoService: SerialNoService,
  ) {}

  create(payload: StockEntryDto, req) {
    return this.stockEntryPolicies.validateStockEntry(payload).pipe(
      switchMap(valid => {
        const stockEntry = this.setStockEntryDefaults(payload, req);
        this.createErpNextStockEntry(stockEntry, req);
        return from(this.stockEntryService.create(stockEntry));
      }),
    );
  }

  setStockEntryDefaults(payload: StockEntryDto, clientHttpRequest): StockEntry {
    const stockEntry = new StockEntry();
    Object.assign(stockEntry, payload);
    stockEntry.uuid = uuidv4();
    stockEntry.doctype = STOCK_ENTRY;
    stockEntry.createdOn = payload.posting_date;
    stockEntry.createdByEmail = clientHttpRequest.token.email;
    stockEntry.createdBy = clientHttpRequest.token.fullName;
    stockEntry.docstatus = 1;
    return stockEntry;
  }

  createErpNextStockEntry(payload: StockEntry, req) {
    this.settings
      .find()
      .pipe(
        switchMap(settings => {
          payload.items.filter(item => {
            item.serial_no = item.serial_no.join('\n');
          });
          return this.http.post(
            settings.authServerURL + STOCK_ENTRY_API_ENDPOINT,
            payload,
            { headers: this.settings.getAuthorizationHeaders(req.token) },
          );
        }),
      )
      .subscribe({
        next: success => {
          this.stockEntryService
            .deleteOne({ uuid: payload.uuid })
            .then(done => {})
            .catch(err => {});
          this.updateSerials(payload);
        },
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            STOCK_ENTRY,
            'StockEntry',
            req,
          );
        },
      });
  }

  updateSerials(payload: StockEntry) {
    from(payload.items)
      .pipe(
        switchMap(item => {
          return from(
            this.serialNoService.updateMany(
              { serial_no: { $in: [...item.serial_no.split('\n')] } },
              { $set: { warehouse: item.t_warehouse } },
            ),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }
}
