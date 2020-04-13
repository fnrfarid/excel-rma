import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { FRAPPE_QUEUE_JOB } from '../../../constants/app-strings';
import { PurchaseReceiptSyncService } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import { StockEntryJobService } from '../../../stock-entry/schedular/stock-entry-sync/stock-entry-sync.service';
import { DeliveryNoteJobService } from '../../../delivery-note/schedular/delivery-note-job/delivery-note-job.service';

@Injectable()
export class FrappeJobService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    public readonly CREATE_PURCHASE_RECEIPT_JOB: PurchaseReceiptSyncService,
    public readonly CREATE_STOCK_ENTRY_JOB: StockEntryJobService,
    public readonly CREATE_DELIVERY_NOTE_JOB: DeliveryNoteJobService,
  ) {}

  async onModuleInit() {
    this.agenda.define(
      FRAPPE_QUEUE_JOB,
      { concurrency: 1 },
      async (job: any, done) => {
        // Please note done callback will work only when concurrency is provided.
        this[job.attrs.data.type]
          .execute(job)
          .toPromise()
          .then(success => {
            return done();
          })
          .catch(err => {
            this[job.attrs.data.type].failureCallback(job);
            return done(err);
          });
      },
    );
  }
}
