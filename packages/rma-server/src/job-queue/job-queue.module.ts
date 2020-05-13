import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { AgendaJob } from './entities/agenda-job/agenda-job.entity';
import { AgendaJobService } from './entities/agenda-job/agenda-job.service';
import { JobQueueAggregateService } from './aggregates/job-queue-aggregate/job-queue-aggregate.service';
import { JobQueueController } from './controllers/job-queue/job-queue.controller';
import { SyncModule } from '../sync/sync.module';

@Module({
  providers: [JobQueueAggregateService, AgendaJobService],
  imports: [
    TypeOrmModule.forFeature([AgendaJob]),
    forwardRef(() => SyncModule),
  ],
  exports: [JobQueueAggregateService, AgendaJobService],
  controllers: [JobQueueController],
})
export class JobQueueModule {}
