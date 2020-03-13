import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import {
  flatMap,
  toArray,
  catchError,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { of, from, throwError } from 'rxjs';
import * as uuidv4 from 'uuid/v4';

import { SyncAggregateService } from '../../../sync/aggregates/sync-aggregate/sync-aggregate.service';
import { SERIAL_NO_DOCTYPE_NAME } from '../../../constants/app-strings';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';
import { SyncAlreadyInProgressException } from '../../../constants/exceptions';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';

export const SERIAL_NO_SYNC_CRON_STRING = '0 */15 * * * *';

@Injectable()
export class SerialNoSyncService implements OnModuleInit {
  constructor(
    private readonly sync: SyncAggregateService,
    private readonly serial: SerialNoService,
    private readonly requestState: RequestStateService,
  ) {}

  onModuleInit() {
    const job = new CronJob(SERIAL_NO_SYNC_CRON_STRING, async () => {
      from(this.requestState.findOne({ syncDocType: SERIAL_NO_DOCTYPE_NAME }))
        .pipe(
          switchMap(state => {
            if (state) {
              return throwError(new SyncAlreadyInProgressException());
            }
            return from(
              this.requestState.save({
                uuid: uuidv4(),
                syncDocType: SERIAL_NO_DOCTYPE_NAME,
              }),
            );
          }),
          switchMap(state => {
            return this.sync.syncDocTypeToEntity(
              SERIAL_NO_DOCTYPE_NAME,
              20,
              '["*"]',
            );
          }),
          flatMap((array: unknown[]) => array),
          mergeMap((erpnextSerial: SerialNo) => {
            this.serial
              .findOne({ name: erpnextSerial.name })
              .then(serial => {
                if (serial && serial.modified !== erpnextSerial.modified) {
                  return this.serial.updateOne(
                    { name: erpnextSerial.name },
                    { $set: erpnextSerial },
                  );
                } else if (!serial) {
                  return new Promise((resolve, reject) => {
                    erpnextSerial.uuid = uuidv4();
                    this.serial
                      .create(erpnextSerial)
                      .then(() => resolve(erpnextSerial))
                      .catch(error => reject(error));
                  });
                }
              })
              .then(success => {})
              .catch(error => {});
            return of(erpnextSerial);
          }),
          toArray(),
          catchError(error => {
            return of({
              error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            });
          }),
        )
        .subscribe({
          next: success => {
            this.requestState
              .findOne({ syncDocType: SERIAL_NO_DOCTYPE_NAME })
              .then(state => {
                if (state) {
                  return this.requestState.deleteMany({
                    syncDocType: SERIAL_NO_DOCTYPE_NAME,
                  });
                }
              })
              .then(deleted => {});
          },
          error: error => {},
        });
    });
    job.start();
  }
}
