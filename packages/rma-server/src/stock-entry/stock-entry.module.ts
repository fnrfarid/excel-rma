import { ErrorLogModule } from '../error-log/error-logs-invoice.module';
import { StockEntryAggregateService } from './aggregates/stock-entry-aggregate/stock-entry-aggregate.service';
import { StockEntryPoliciesService } from './stock-entry-policies/stock-entry-policies.service';
import { StockEntryController } from './controller/stock-entry.controller';
import { Module } from '@nestjs/common';
import { StockEntry } from './stock-entry/stock-entry.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockEntryService } from './stock-entry/stock-entry.service';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';

@Module({
  imports: [
    ErrorLogModule,
    TypeOrmModule.forFeature([StockEntry]),
    SerialNoEntitiesModule,
  ],
  controllers: [StockEntryController],
  providers: [
    StockEntryAggregateService,
    StockEntryPoliciesService,
    StockEntryService,
  ],
  exports: [],
})
export class StockEntryModule {}
