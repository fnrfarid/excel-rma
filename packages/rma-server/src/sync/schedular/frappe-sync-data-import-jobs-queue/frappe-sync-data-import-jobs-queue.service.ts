import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import {
  FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB,
  AGENDA_JOB_STATUS,
} from '../../../constants/app-strings';
import { DateTime } from 'luxon';
import { DeliveryNoteJobService } from '../../../delivery-note/schedular/delivery-note-job/delivery-note-job.service';

@Injectable()
export class FrappeSyncDataImportJobService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    public readonly SYNC_DELIVERY_NOTE_JOB: DeliveryNoteJobService,
  ) {}

  async onModuleInit() {
    this.agenda.define(
      FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB,
      { concurrency: 1 },
      async (job: any, done) => {
        // Please note done callback will work only when concurrency is provided.
        this[job.attrs.data.type]
          .syncImport(job.attrs.data)
          .toPromise()
          .then(success => {
            job.attrs.data.status = AGENDA_JOB_STATUS.success;
            return done();
          })
          .catch(err => {
            job.attrs.data.status = AGENDA_JOB_STATUS.retrying;
            return done(this.getPureError(err));
          });
      },
    );
    this.agenda.on(`fail:${FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB}`, (error, job) =>
      this.onJobFailure(error, job),
    );
  }

  async onJobFailure(error: any, job: Agenda.Job<any>) {
    const retryCount = job.attrs.failCount - 1;
    if (!(error && error.log_details)) {
      job.attrs.data.status = AGENDA_JOB_STATUS.retrying;
      job.attrs.nextRunAt = this.getBackOff(
        retryCount,
        job.attrs.data.settings.timeZone,
      );
    } else {
      job.attrs.data.status = AGENDA_JOB_STATUS.fail;
    }
    await job.save();
  }

  getBackOff(retryCount: number, timeZone): Date {
    return new DateTime(timeZone)
      .plus({ seconds: retryCount === 0 ? 150 : 300 })
      .toJSDate();
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
