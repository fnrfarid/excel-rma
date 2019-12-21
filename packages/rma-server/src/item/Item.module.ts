import { Module, HttpModule } from '@nestjs/common';
import { ItemAggregatesManager } from './aggregates';
import { ItemEntitiesModule } from './entity/entity.module';
import { ItemQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { ItemController } from './controllers/item/item.controller';
import { ItemPoliciesService } from './policies/item-policies/item-policies.service';

@Module({
  imports: [ItemEntitiesModule, CqrsModule, HttpModule],
  controllers: [ItemController],
  providers: [
    ...ItemAggregatesManager,
    ...ItemQueryManager,
    ItemPoliciesService,
  ],
  exports: [ItemEntitiesModule],
})
export class ItemModule {}
