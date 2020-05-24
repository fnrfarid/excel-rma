import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import {
  FRAPPE_QUEUE_JOB,
  AGENDA_JOB_STATUS,
  AGENDA_MAX_RETRIES,
} from '../../../constants/app-strings';
import { DateTime } from 'luxon';
import { PurchaseReceiptSyncService } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import { StockEntryJobService } from '../../../stock-entry/schedular/stock-entry-sync/stock-entry-sync.service';
import { DeliveryNoteJobService } from '../../../delivery-note/schedular/delivery-note-job/delivery-note-job.service';
import { AcceptStockEntryJobService } from '../../../stock-entry/schedular/accept-stock-entry-sync/accept-stock-entry-sync.service';
import { AgendaJob } from '../../../job-queue/entities/agenda-job/agenda-job.entity';

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
            job.attrs.data.status = AGENDA_JOB_STATUS.exported;
            return done();
          })
          .catch(err => {
            if (job.attrs.data.type === this.CREATE_DELIVERY_NOTE_JOB) {
              job.attrs.data.status = AGENDA_JOB_STATUS.retrying;
            }
            job.attrs.data.status = AGENDA_JOB_STATUS.success;
            return done(this.getPureError(err));
          });
      },
    );
    this.agenda.on(`fail:${FRAPPE_QUEUE_JOB}`, (error, job) =>
      this.onJobFailure(error, job),
    );
  }

  resetState(job: AgendaJob) {
    return this[job.data.type].resetState(job);
  }

  async onJobFailure(error: any, job: Agenda.Job<any>) {
    const retryCount = job.attrs.failCount - 1;
    if (retryCount < AGENDA_MAX_RETRIES) {
      job.attrs.data.status = AGENDA_JOB_STATUS.retrying;
      job.attrs.nextRunAt = this.getExponentialBackOff(
        retryCount,
        job.attrs.data.settings.timeZone,
      );
    } else {
      job.attrs.data.status = AGENDA_JOB_STATUS.fail;
    }
    await job.save();
  }

  getExponentialBackOff(retryCount: number, timeZone): Date {
    const waitInSeconds =
      Math.pow(retryCount, 4) + 15 + Math.random() * 30 * (retryCount + 1);
    return new DateTime(timeZone).plus({ seconds: waitInSeconds }).toJSDate();
  }

  replaceErrors(keys, value) {
    if (value instanceof Error) {
      const error = {};

      Object.getOwnPropertyNames(value).forEach(function (key) {
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
