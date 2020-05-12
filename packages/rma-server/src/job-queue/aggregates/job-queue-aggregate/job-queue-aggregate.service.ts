import { Injectable, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { ObjectId } from 'mongodb';
import { AGENDA_JOB_STATUS } from '../../../constants/app-strings';

@Injectable()
export class JobQueueAggregateService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly jobService: AgendaJobService,
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
