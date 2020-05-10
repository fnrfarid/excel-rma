import { Module } from '@nestjs/common';
import { PurchaseReceiptAggregatesManager } from './aggregates';
import { PurchaseReceiptController } from './controllers/purchase-receipt/purchase-receipt.controller';
import { PurchaseInvoiceEntitiesModule } from '../purchase-invoice/entity/entity.module';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { PurchaseReceiptPoliciesService } from './purchase-receipt-policies/purchase-receipt-policies.service';
import { ErrorLogModule } from '../error-log/error-logs-invoice.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseReceiptService } from './entity/purchase-receipt.service';
import { PurchaseReceipt } from './entity/purchase-receipt.entity';
import { DirectModule } from '../direct/direct.module';
import { PurchaseReceiptSchedularManager } from './schedular';
import { PurchaseOrderEntitiesModule } from '../purchase-order/entity/entity.module';
import { JobQueueModule } from '../job-queue/job-queue.module';

@Module({
  imports: [
    PurchaseInvoiceEntitiesModule,
    SerialNoEntitiesModule,
    DirectModule,
    ErrorLogModule,
    PurchaseOrderEntitiesModule,
    JobQueueModule,
    TypeOrmModule.forFeature([PurchaseReceipt]),
  ],
  controllers: [PurchaseReceiptController],
  providers: [
    ...PurchaseReceiptAggregatesManager,
    ...PurchaseReceiptSchedularManager,
    PurchaseReceiptPoliciesService,
    PurchaseReceiptService,
  ],
  exports: [...PurchaseReceiptSchedularManager],
})
export class PurchaseReceiptModule {}
