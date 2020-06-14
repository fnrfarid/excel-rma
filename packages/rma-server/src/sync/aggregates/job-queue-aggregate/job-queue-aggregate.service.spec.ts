import { Test, TestingModule } from '@nestjs/testing';
import { JobQueueAggregateService } from './job-queue-aggregate.service';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { FrappeJobService } from '../../schedular/frappe-jobs-queue/frappe-jobs-queue.service';

describe('JobQueueAggregateService', () => {
  let service: JobQueueAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobQueueAggregateService,
        { provide: AgendaJobService, useValue: {} },
        { provide: AGENDA_TOKEN, useValue: {} },
        { provide: FrappeJobService, useValue: {} },
      ],
    }).compile();

    service = module.get<JobQueueAggregateService>(JobQueueAggregateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
