import { Module } from '@nestjs/common';
import { PurchaseOrderEntitiesModule } from './entity/entity.module';
import { DirectModule } from '../direct/direct.module';
import { PurchaseOrderControllers } from './controllers';
import { PurchaseOrderAggregates } from './aggregates';
import { PurchaseOrderQueries } from './query';
import { PurchaseOrderPoliciesManager } from './policies';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { PurchaseInvoiceEntitiesModule } from '../purchase-invoice/entity/entity.module';

@Module({
  imports: [
    PurchaseOrderEntitiesModule,
    DirectModule,
    SerialNoEntitiesModule,
    PurchaseInvoiceEntitiesModule,
  ],
  providers: [
    ...PurchaseOrderAggregates,
    ...PurchaseOrderQueries,
    ...PurchaseOrderPoliciesManager,
  ],
  exports: [PurchaseOrderEntitiesModule],
  controllers: [...PurchaseOrderControllers],
})
export class PurchaseOrderModule {}
