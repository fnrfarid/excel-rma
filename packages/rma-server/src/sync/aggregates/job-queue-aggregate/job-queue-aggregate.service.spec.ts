import { Test, TestingModule } from '@nestjs/testing';
import { JobQueueAggregateService } from './job-queue-aggregate.service';
import { AgendaJobService } from '../../entities/agenda-job/agenda-job.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { FrappeJobService } from '../../schedular/frappe-jobs-queue/frappe-jobs-queue.service';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { HttpService } from '@nestjs/common';
import { PurchaseReceiptSyncService } from '../../../purchase-receipt/schedular/purchase-receipt-sync/purchase-receipt-sync.service';

describe('JobQueueAggregateService', () => {
  let service: JobQueueAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobQueueAggregateService,
        { provide: AgendaJobService, useValue: {} },
        { provide: AGENDA_TOKEN, useValue: {} },
        { provide: FrappeJobService, useValue: {} },
        { provide: DirectService, useValue: {} },
        { provide: HttpService, useValue: {} },
        { provide: PurchaseReceiptSyncService, useValue: {} },
      ],
    }).compile();

    service = module.get<JobQueueAggregateService>(JobQueueAggregateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
