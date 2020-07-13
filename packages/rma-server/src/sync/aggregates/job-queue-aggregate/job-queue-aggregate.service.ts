import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { ObjectId } from 'mongodb';
import {
  AGENDA_JOB_STATUS,
  SYNC_DELIVERY_NOTE_JOB,
  SYNC_PURCHASE_RECEIPT_JOB,
  FRAPPE_JOB_SELECT_FIELDS,
  CREATE_DELIVERY_NOTE_JOB,
} from '../../../constants/app-strings';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FrappeJobService } from '../../schedular/frappe-jobs-queue/frappe-jobs-queue.service';
import { CREATE_PURCHASE_RECEIPT_JOB } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';

@Injectable()
export class JobQueueAggregateService {
  resetJobs: string[] = [CREATE_PURCHASE_RECEIPT_JOB, CREATE_DELIVERY_NOTE_JOB];
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly jobService: AgendaJobService,
    private readonly frappeQueueService: FrappeJobService,
  ) {}

  async list(skip, take, sort, filter, token) {
    return await this.jobService.list(
      Number(skip),
      Number(take),
      sort,
      token,
      filter,
    );
  }

  resetJob(jobId) {
    return from(this.jobService.findOne({ _id: new ObjectId(jobId) })).pipe(
      switchMap(job => {
        if (!job) {
          return throwError(new BadRequestException('Job not found.'));
        }
        if (
          job.data.status === AGENDA_JOB_STATUS.reset ||
          job.data.status === AGENDA_JOB_STATUS.success
        ) {
          return throwError(
            new BadRequestException(
              `Jobs with status ${job.data.status}, cannot be reseted.`,
            ),
          );
        }
        // remove after new feature added
        if (!this.resetJobs.includes(job.data.type)) {
          return throwError(
            new BadRequestException(
              `Reset State currently available for
              ${this.resetJobs
                .filter(elem => elem.replace('_', ' ').toLocaleLowerCase())
                .join(', ')}, coming soon for
              ${job.data.type.replace('_', ' ').toLocaleLowerCase()}`,
            ),
          );
        }

        return this.frappeQueueService.resetState(job).pipe(
          switchMap(success => {
            const $or: any[] = [{ _id: new ObjectId(jobId) }];
            if (job.data && job.data.uuid) {
              $or.push({ 'data.uuid': job.data.uuid });
            }
            this.jobService
              .updateOne(
                { $or },
                {
                  $set: { 'data.status': AGENDA_JOB_STATUS.reset },
                  $unset: {
                    nextRunAt: undefined,
                    lockedAt: undefined,
                    lastRunAt: undefined,
                  },
                },
              )
              .catch(err => {})
              .then(done => {});
            return of({});
          }),
        );
      }),
    );
  }

  async retryJob(jobId) {
    return await this.jobService.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          nextRunAt: new Date(),
          'data.status': AGENDA_JOB_STATUS.in_queue,
          failCount: 0,
        },
      },
    );
  }

  async create(jobId: string) {
    const _id = new ObjectId(jobId);
    const job = await this.jobService.findOne({ _id });
    const newJob = this.agenda.create(job.name, job.data);
    await newJob.save();
    return newJob;
  }

  async getOneDataImportJob(uuid: string) {
    const job = await this.jobService.findOne({
      where: {
        'data.type': {
          $in: [SYNC_DELIVERY_NOTE_JOB, SYNC_PURCHASE_RECEIPT_JOB],
        },
        'data.uuid': uuid,
      },
      select: FRAPPE_JOB_SELECT_FIELDS,
    });

    if (!job) {
      return throwError(new BadRequestException('Export job dose not exists.'));
    }

    return job;
  }
}
