import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AgendaJob } from './entities/agenda-job/agenda-job.entity';
import { AgendaJobService } from './entities/agenda-job/agenda-job.service';
import { JobQueueAggregateService } from './aggregates/job-queue-aggregate/job-queue-aggregate.service';
import { JobQueueController } from './controllers/job-queue/job-queue.controller';

@Module({
  providers: [JobQueueAggregateService, AgendaJobService],
  imports: [TypeOrmModule.forFeature([AgendaJob])],
  exports: [JobQueueAggregateService, AgendaJobService],
  controllers: [JobQueueController],
})
export class JobQueueModule {}
