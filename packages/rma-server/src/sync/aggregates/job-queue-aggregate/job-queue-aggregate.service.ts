import {
  Injectable,
  Inject,
  BadRequestException,
  HttpService,
} from '@nestjs/common';
import * as Agenda from 'agenda';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { ObjectId } from 'mongodb';
import {
  AGENDA_JOB_STATUS,
  SYNC_DELIVERY_NOTE_JOB,
  SYNC_PURCHASE_RECEIPT_JOB,
  FRAPPE_JOB_SELECT_FIELDS,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import { from, throwError, of } from 'rxjs';
import { switchMap, map, catchError, retry } from 'rxjs/operators';
import { FrappeJobService } from '../../schedular/frappe-jobs-queue/frappe-jobs-queue.service';
import { PurchaseReceiptSyncService } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import { ExcelDataImportWebhookDto } from '../../../constants/listing-dto/job-queue-list-query.dto';
import { FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT } from '../../../constants/routes';
import {
  AUTHORIZATION,
  VALIDATE_AUTH_STRING,
} from '../../../constants/app-strings';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';

@Injectable()
export class JobQueueAggregateService {
  resetJobs: string[] = [
    'CREATE_PURCHASE_RECEIPT_JOB',
    'CREATE_DELIVERY_NOTE_JOB',
  ];
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly jobService: AgendaJobService,
    private readonly frappeQueueService: FrappeJobService,
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly CREATE_PURCHASE_RECEIPT_JOB: PurchaseReceiptSyncService,
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

  jobUpdated(payload: ExcelDataImportWebhookDto) {
    this.syncUpdatedJob(payload);
    return from(
      this.jobService.updateOne(
        { 'data.uuid': payload.uuid },
        {
          $set: {
            'data.status': payload.error_log
              ? AGENDA_JOB_STATUS.fail
              : AGENDA_JOB_STATUS.success,
            failReason: payload.error_log ? payload.error_log : '',
          },
        },
      ),
    );
  }

  syncUpdatedJob(payload: ExcelDataImportWebhookDto) {
    from(this.jobService.findOne({ 'data.uuid': payload.uuid }))
      .pipe(
        switchMap(job => {
          if (!job) {
            return throwError('Parent job dose not exists.');
          }
          return of({}).pipe(
            switchMap(object => {
              const headers = {};
              headers[AUTHORIZATION] =
                BEARER_HEADER_VALUE_PREFIX + job.data.token.accessToken;
              return this.http
                .get(
                  job.data.settings.authServerURL +
                    `${FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT}/${payload.success_log}`,
                  { headers },
                )
                .pipe(
                  map(data => data.data.data),
                  switchMap((purchase_receipt: { items: any[] }) => {
                    return this.CREATE_PURCHASE_RECEIPT_JOB.linkPurchaseWarranty(
                      job.data.payload,
                      {
                        name: payload.success_log,
                        items: purchase_receipt.items,
                      },
                      job.data.token,
                      job.data.settings,
                      job.data.parent,
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
                return this.tokenService
                  .getUserAccessToken(job.data.token.email)
                  .pipe(
                    switchMap(token => {
                      job.data.token.accessToken = token.accessToken;
                      return throwError(err);
                    }),
                  );
              }
              return throwError(err);
            }),
            retry(3),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: error => {
          this.jobService
            .updateOne(
              { 'data.uuid': payload.uuid },
              {
                $set: {
                  'data.status': AGENDA_JOB_STATUS.fail,
                  failReason: error,
                },
              },
            )
            .then(success => {})
            .catch(err => {});
        },
      });
  }
}
