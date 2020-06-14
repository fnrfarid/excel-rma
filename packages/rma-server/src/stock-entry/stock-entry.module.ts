import { StockEntryAggregateService } from './aggregates/stock-entry-aggregate/stock-entry-aggregate.service';
import { StockEntryPoliciesService } from './policies/stock-entry-policies/stock-entry-policies.service';
import { StockEntryController } from './controller/stock-entry.controller';
import { Module } from '@nestjs/common';
import { StockEntry } from './stock-entry/stock-entry.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockEntryService } from './stock-entry/stock-entry.service';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { DirectModule } from '../direct/direct.module';
import { StockEntrySyncService } from './schedular/stock-entry-sync/stock-entry-sync.service';
import { SerialBatchService } from '../sync/aggregates/serial-batch/serial-batch.service';
import { AcceptStockEntryJobService } from './schedular/accept-stock-entry-sync/accept-stock-entry-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockEntry]),
    SerialNoEntitiesModule,
    DirectModule,
  ],
  controllers: [StockEntryController],
  providers: [
    StockEntryAggregateService,
    StockEntryPoliciesService,
    StockEntryService,
    StockEntrySyncService,
    AcceptStockEntryJobService,
    SerialBatchService,
  ],
  exports: [StockEntrySyncService, AcceptStockEntryJobService],
})
export class StockEntryModule {}
