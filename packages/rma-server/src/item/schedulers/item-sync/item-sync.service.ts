import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import {
  flatMap,
  toArray,
  catchError,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { of, from, throwError } from 'rxjs';
import * as uuidv4 from 'uuid/v4';
import * as Agenda from 'agenda';

import { SyncAggregateService } from '../../../sync/aggregates/sync-aggregate/sync-aggregate.service';
import { ITEM_DOCTYPE } from '../../../constants/app-strings';
import { ItemService } from '../../entity/item/item.service';
import { Item } from '../../entity/item/item.entity';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';
import { SyncAlreadyInProgressException } from '../../../constants/exceptions';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const ITEM_SYNC_SCHEDULE = 'ITEM_SYNC_SCHEDULE';

@Injectable()
export class ItemSyncService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly sync: SyncAggregateService,
    private readonly item: ItemService,
    private readonly requestState: RequestStateService,
  ) {}

  onModuleInit() {
    this.agenda.define(ITEM_SYNC_SCHEDULE, async job => {
      from(this.requestState.findOne({ syncDocType: ITEM_DOCTYPE }))
        .pipe(
          switchMap(state => {
            if (state) {
              return throwError(new SyncAlreadyInProgressException());
            }
            return from(
              this.requestState.save({
                uuid: uuidv4(),
                syncDocType: ITEM_DOCTYPE,
              }),
            );
          }),
          switchMap(state => {
            return this.sync.syncDocTypeToEntity(
              'Item',
              20,
              '["*"]',
              '[["has_serial_no","=",1]]',
              '{"has_serial_no":1}',
            );
          }),
          flatMap((array: unknown[]) => array),
          mergeMap((erpnextItem: Item) => {
            this.item
              .findOne({ name: erpnextItem.name })
              .then(item => {
                if (item && item.modified !== erpnextItem.modified) {
                  return this.item.updateOne(
                    { name: erpnextItem.name },
                    { $set: erpnextItem },
                  );
                } else if (!item) {
                  return new Promise((resolve, reject) => {
                    erpnextItem.uuid = uuidv4();
                    this.item
                      .create(erpnextItem)
                      .then(() => resolve(erpnextItem))
                      .catch(error => reject(error));
                  });
                }
              })
              .then(success => {})
              .catch(error => {});
            return of(erpnextItem);
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
              .findOne({ syncDocType: ITEM_DOCTYPE })
              .then(state => {
                if (state) {
                  return this.requestState.deleteMany({
                    syncDocType: ITEM_DOCTYPE,
                  });
                }
              })
              .then(deleted => {});
          },
          error: error => {},
        });
    });
    this.agenda
      .every('15 minutes', ITEM_SYNC_SCHEDULE)
      .then(scheduled => {})
      .catch(error => {});
  }
}
