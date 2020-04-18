import { Module, HttpModule } from '@nestjs/common';
import { SyncAggregateService } from './aggregates/sync-aggregate/sync-aggregate.service';
import { AuthModule } from '../auth/auth.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { FrappeJobService } from './schedular/frappe-jobs-queue/frappe-jobs-queue.service';
import { PurchaseReceiptModule } from '../purchase-receipt/purchase-receipt.module';
import { StockEntryModule } from '../stock-entry/stock-entry.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';
import { SerialBatchService } from './aggregates/serial-batch/serial-batch.service';

@Module({
  imports: [
    AuthModule,
    SystemSettingsModule,
    HttpModule,
    PurchaseReceiptModule,
    StockEntryModule,
    DeliveryNoteModule,
  ],
  providers: [SyncAggregateService, FrappeJobService, SerialBatchService],
  exports: [SyncAggregateService, SerialBatchService],
})
export class SyncModule {}
