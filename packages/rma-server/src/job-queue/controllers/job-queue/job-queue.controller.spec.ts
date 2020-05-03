import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/common';
import { JobQueueController } from './job-queue.controller';
import { JobQueueAggregateService } from '../../../job-queue/aggregates/job-queue-aggregate/job-queue-aggregate.service';
import { TokenCacheService } from '../../../auth/entities/token-cache/token-cache.service';
import { TokenGuard } from '../../../auth/guards/token.guard';

describe('JobQueue Controller', () => {
  let controller: JobQueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobQueueController],
      providers: [
        { provide: JobQueueAggregateService, useValue: {} },
        {
          provide: TokenCacheService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(TokenGuard)
      .useValue({})
      .compile();

    controller = module.get<JobQueueController>(JobQueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
