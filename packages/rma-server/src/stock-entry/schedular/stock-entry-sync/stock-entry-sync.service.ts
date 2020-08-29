import { Injectable, HttpService } from '@nestjs/common';
import { switchMap, mergeMap, catchError, retry, map } from 'rxjs/operators';
import { VALIDATE_AUTH_STRING, STOCK_ENTRY } from '../../../constants/app-strings';
import { STOCK_ENTRY_API_ENDPOINT } from '../../../constants/routes';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { of, throwError, from, forkJoin } from 'rxjs';
import { DateTime } from 'luxon';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { AgendaJobService } from '../../../sync/entities/agenda-job/agenda-job.service';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import { EventType } from '../../../serial-no/entity/serial-no-history/serial-no-history.entity';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { SerialNoHistory } from '../../../serial-no/entity/serial-no-history/serial-no-history.entity';

export const CREATE_STOCK_ENTRY_JOB = 'CREATE_STOCK_ENTRY_JOB';
export const ACCEPT_STOCK_ENTRY_JOB = 'ACCEPT_STOCK_ENTRY_JOB';
export const REJECT_STOCK_ENTRY_JOB = 'REJECT_STOCK_ENTRY_JOB';
@Injectable()
export class StockEntrySyncService {
  constructor(
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly serialNoService: SerialNoService,
    private readonly stockEntryService: StockEntryService,
    private readonly jobService: AgendaJobService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
  ) {}

  execute(job) {
    return this.createStockEntry(job.attrs.data);
  }

  resetState(job) {
    this.updateStockEntryState(job.attrs.data.payload.uuid, {
      isSynced: false,
      inQueue: false,
    });
    return;
  }

  createStockEntry(job: {
    payload: StockEntry;
    token: any;
    settings: any;
    parent: string;
    type: string;
  }) {
    const payload = job.payload;
    return of({}).pipe(
      mergeMap(object => {
        return this.settingsService.find().pipe(
          switchMap(settings => {
            job.settings = settings;
            payload.items.filter((item: any) => {
              if (job.type === CREATE_STOCK_ENTRY_JOB) {
                item.t_warehouse = item.transferWarehouse;
              }
              if (job.type === ACCEPT_STOCK_ENTRY_JOB) {
                item.s_warehouse = item.transferWarehouse;
              }
              if (job.type === REJECT_STOCK_ENTRY_JOB) {
                item.t_warehouse = item.s_warehouse;
                item.s_warehouse = item.transferWarehouse;
              }
              if (typeof item.serial_no === 'object') {
                item.serial_no = item.serial_no.join('\n');
              }
              item.excel_serials = item.serial_no;
              delete item.serial_no;
              return item;
            });
            return this.http.post(
              settings.authServerURL + STOCK_ENTRY_API_ENDPOINT,
              payload,
              {
                headers: this.settingsService.getAuthorizationHeaders(
                  job.token,
                ),
              },
            );
          }),
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
        // new approach, we wont reset state let the user retry it from agenda UI.
        return throwError(err);
      }),
      retry(3),
      map(data => data.data.data),
      switchMap(response => {
        payload.items.filter(item => {
          item.serial_no = this.getSplitSerials(item.excel_serials);
          delete item.excel_serials;
          return item;
        })
        this.updateSerials(payload,job.token,response.name,job.type,job.settings,job.parent);
        this.stockEntryService
          .updateOne({ uuid: job.parent }, { $push: { names: response.name } })
          .then(success => {})
          .catch(err => {});
        return of({});
      }),
    );
  }


  updateSerials(payload: StockEntry,token: TokenCache,doc_name:string,type:string,settings,parent) {
    this.updateStockEntryState(payload.uuid, {
      isSynced: true,
      inQueue: false,
    });
    from(payload.items)
      .pipe(
        switchMap(item => {
          const serials = this.getSplitSerials(item.serial_no);
          const serialHistory = new SerialNoHistory();
          serialHistory.created_by = token.fullName;
          serialHistory.created_on =  new DateTime(settings.timeZone).toJSDate();
          serialHistory.document_no = doc_name;
          serialHistory.document_type = STOCK_ENTRY;
          serialHistory.eventDate = new DateTime(settings.timeZone);
          serialHistory.eventType =  this.getEventType(type);
          serialHistory.parent_document = parent;
          serialHistory.transaction_from = item.s_warehouse;
          serialHistory.transaction_to = item.t_warehouse;
          return forkJoin({
            serials : this.updateMongoSerials(serials, item.t_warehouse),
            serial_history: this.serialNoHistoryService.addSerialHistory(serials,serialHistory)
          });
        })
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  getEventType(type:string){
    if (type === ACCEPT_STOCK_ENTRY_JOB) {
      return EventType.SerialTransferAccepted
    }
    if (type === REJECT_STOCK_ENTRY_JOB) {
      return EventType.SerialTransferRejected
    }
    return EventType.SerialTransferCreated
  }

  updateMongoSerials(serials, warehouse) {
    return from(
      this.serialNoService.updateMany(
        { serial_no: { $in: serials } },
        { $set: { warehouse } },
      ),
    )
  }

  getSplitSerials(serials) {
    if(typeof serials === 'string'){
      serials = serials.split('\n');
    }
    return serials;
  }

  updateStockEntryState(
    uuid: string,
    update: { isSynced: boolean; inQueue: boolean },
  ) {
    this.stockEntryService
      .updateOne({ uuid }, { $set: update })
      .then(success => {})
      .catch(error => {});
  }
}
