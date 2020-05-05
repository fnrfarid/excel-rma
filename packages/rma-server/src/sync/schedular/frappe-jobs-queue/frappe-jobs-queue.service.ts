import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import {
  FRAPPE_QUEUE_JOB,
  AGENDA_JOB_STATUS,
} from '../../../constants/app-strings';
import { PurchaseReceiptSyncService } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import { StockEntryJobService } from '../../../stock-entry/schedular/stock-entry-sync/stock-entry-sync.service';
import { DeliveryNoteJobService } from '../../../delivery-note/schedular/delivery-note-job/delivery-note-job.service';
import { AcceptStockEntryJobService } from '../../../stock-entry/schedular/accept-stock-entry-sync/accept-stock-entry-sync.service';

@Injectable()
export class FrappeJobService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    public readonly CREATE_PURCHASE_RECEIPT_JOB: PurchaseReceiptSyncService,
    public readonly CREATE_STOCK_ENTRY_JOB: StockEntryJobService,
    public readonly CREATE_DELIVERY_NOTE_JOB: DeliveryNoteJobService,
    public readonly ACCEPT_STOCK_ENTRY_JOB: AcceptStockEntryJobService,
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
            job.attr.data.status = AGENDA_JOB_STATUS.success;
            return done();
          })
          .catch(err => {
            job.attr.data.status = AGENDA_JOB_STATUS.fail;
            return done(this.getPureError(err));
          });
      },
    );
  }

  replaceErrors(keys, value) {
    if (value instanceof Error) {
      const error = {};

      Object.getOwnPropertyNames(value).forEach(function(key) {
        error[key] = value[key];
      });

      return error;
    }

    return value;
  }

  getPureError(error) {
    if (error && error.response) {
      error = error.response.data ? error.response.data : error.response;
    }
    try {
      return JSON.parse(JSON.stringify(error, this.replaceErrors));
    } catch {
      return error.data ? error.data : error;
    }
  }
}
