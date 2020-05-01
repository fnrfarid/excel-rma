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
import { SALES_INVOICE_DOCTYPE } from '../../../constants/app-strings';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';
import { SyncAlreadyInProgressException } from '../../../constants/exceptions';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const SALES_INVOICE_SYNC_SCHEDULE = 'SALES_INVOICE_SYNC_SCHEDULE';

@Injectable()
export class SalesInvoiceSyncService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly sync: SyncAggregateService,
    private readonly salesInvoice: SalesInvoiceService,
    private readonly requestState: RequestStateService,
  ) {}

  onModuleInit() {
    this.agenda.define(
      SALES_INVOICE_SYNC_SCHEDULE,
      { concurrency: 1 },
      async job => {
        from(this.requestState.findOne({ syncDocType: SALES_INVOICE_DOCTYPE }))
          .pipe(
            switchMap(state => {
              if (state) {
                return throwError(new SyncAlreadyInProgressException());
              }
              return from(
                this.requestState.save({
                  uuid: uuidv4(),
                  syncDocType: SALES_INVOICE_DOCTYPE,
                }),
              );
            }),
            switchMap(state => {
              return this.sync.syncDocTypeToEntity(
                SALES_INVOICE_DOCTYPE,
                20,
                '["*"]',
              );
            }),
            flatMap((array: unknown[]) => array),
            mergeMap((erpnextSI: SalesInvoice) => {
              this.salesInvoice
                .findOne({ name: erpnextSI.name })
                .then(salesInvoice => {
                  if (
                    salesInvoice &&
                    salesInvoice.modified !== erpnextSI.modified
                  ) {
                    return this.salesInvoice.updateOne(
                      { name: erpnextSI.name },
                      { $set: erpnextSI },
                    );
                  } else if (!salesInvoice) {
                    return new Promise((resolve, reject) => {
                      erpnextSI.uuid = uuidv4();
                      this.salesInvoice
                        .create(erpnextSI)
                        .then(() => resolve(erpnextSI))
                        .catch(error => reject(error));
                    });
                  }
                })
                .then(success => {})
                .catch(error => {});
              return of(erpnextSI);
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
                .findOne({ syncDocType: SALES_INVOICE_DOCTYPE })
                .then(state => {
                  if (state) {
                    return this.requestState.deleteMany({
                      syncDocType: SALES_INVOICE_DOCTYPE,
                    });
                  }
                })
                .then(deleted => {});
            },
            error: error => {},
          });
      },
    );

    this.agenda
      .every('15 minutes', SALES_INVOICE_SYNC_SCHEDULE)
      .then(scheduled => {})
      .catch(error => {});
  }
}
