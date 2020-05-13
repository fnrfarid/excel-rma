import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { ObjectId } from 'mongodb';
import { AGENDA_JOB_STATUS } from '../../../constants/app-strings';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FrappeJobService } from '../../../sync/schedular/frappe-jobs-queue/frappe-jobs-queue.service';
import { CREATE_PURCHASE_RECEIPT_JOB } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';

@Injectable()
export class JobQueueAggregateService {
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
        if (job.data.type !== CREATE_PURCHASE_RECEIPT_JOB) {
          return throwError(
            new BadRequestException(
              `Reset State currently available for purchase jobs, coming soon for ${job.data.type
                .replace('_', ' ')
                .toLocaleLowerCase()}`,
            ),
          );
        }
        return this.frappeQueueService.resetState(job).pipe(
          switchMap(success => {
            this.jobService
              .updateOne(
                { _id: new ObjectId(jobId) },
                {
                  $set: {
                    'data.status': AGENDA_JOB_STATUS.reset,
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

  async retrieveOne(_id: string) {
    const id = new ObjectId(_id);
    const job = await this.jobService.findOne({ _id: id });
    return job;
  }
}
