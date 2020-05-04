import { Injectable, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { ObjectId } from 'mongodb';

@Injectable()
export class JobQueueAggregateService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly job: AgendaJobService,
  ) {}

  async list(skip, take, sort, filter) {
    return await this.job.list(Number(skip), Number(take), sort, filter);
  }

  async create(jobId: string) {
    const _id = new ObjectId(jobId);
    const job = await this.job.findOne({ _id });
    const newJob = this.agenda.create(job.name, job.data);
    await newJob.save();
    return newJob;
  }

  async retrieveOne(_id: string) {
    const id = new ObjectId(_id);
    const job = await this.job.findOne({ _id: id });
    return job;
  }
}
