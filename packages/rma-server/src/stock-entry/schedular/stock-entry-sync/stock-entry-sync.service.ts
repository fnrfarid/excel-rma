import { Injectable, HttpService } from '@nestjs/common';
import { switchMap, mergeMap, catchError, retry } from 'rxjs/operators';
import { VALIDATE_AUTH_STRING } from '../../../constants/app-strings';
import { STOCK_ENTRY_API_ENDPOINT } from '../../../constants/routes';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { of, throwError, from } from 'rxjs';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { AgendaJobService } from '../../../job-queue/entities/agenda-job/agenda-job.service';

export const CREATE_STOCK_ENTRY_JOB = 'CREATE_STOCK_ENTRY_JOB';
export const ACCEPT_STOCK_ENTRY_JOB = 'ACCEPT_STOCK_ENTRY_JOB';
@Injectable()
export class StockEntryJobService {
  constructor(
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly serialNoService: SerialNoService,
    private readonly stockEntryService: StockEntryService,
    private readonly jobService: AgendaJobService,
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

  createStockEntry(job: { payload: StockEntry; token: any }) {
    const payload = job.payload;
    return of({}).pipe(
      mergeMap(object => {
        return this.settingsService.find().pipe(
          switchMap(settings => {
            payload.items.filter((item: any) => {
              item.t_warehouse = item.transferWarehouse;
              if (typeof item.serial_no === 'object') {
                item.serial_no = item.serial_no.join('\n');
              }
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
      switchMap(success => {
        this.updateSerials(payload);
        return of({});
      }),
    );
  }

  updateSerials(payload: StockEntry) {
    this.updateStockEntryState(payload.uuid, {
      isSynced: true,
      inQueue: false,
    });
    from(payload.items)
      .pipe(
        switchMap(item => {
          const serials = this.getSplitSerials(item.serial_no);
          return this.updateMongoSerials(serials, item.t_warehouse);
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  updateMongoSerials(serials, warehouse) {
    return from(
      this.serialNoService.updateMany(
        { serial_no: { $in: serials } },
        { $set: { warehouse } },
      ),
    );
  }

  getSplitSerials(serials) {
    const serial_no = serials.split('\n');
    return serial_no;
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
