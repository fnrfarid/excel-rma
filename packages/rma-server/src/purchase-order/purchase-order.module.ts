import { Module } from '@nestjs/common';
import { PurchaseOrderEntitiesModule } from './entity/entity.module';
import { DirectModule } from '../direct/direct.module';
import { PurchaseOrderControllers } from './controllers';
import { PurchaseOrderAggregates } from './aggregates';
import { PurchaseOrderQueries } from './query';

@Module({
  imports: [PurchaseOrderEntitiesModule, DirectModule],
  providers: [...PurchaseOrderAggregates, ...PurchaseOrderQueries],
  exports: [PurchaseOrderEntitiesModule],
  controllers: [...PurchaseOrderControllers],
})
export class PurchaseOrderModule {}
