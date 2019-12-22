import { Module, HttpModule } from '@nestjs/common';
import { ItemAggregatesManager } from './aggregates';
import { ItemEntitiesModule } from './entity/entity.module';
import { ItemQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { ItemController } from './controllers/item/item.controller';
import { ItemPoliciesService } from './policies/item-policies/item-policies.service';
import { ItemWebhookController } from './controllers/item-webhook/item-webhook.controller';

@Module({
  imports: [ItemEntitiesModule, CqrsModule, HttpModule],
  controllers: [ItemController, ItemWebhookController],
  providers: [
    ...ItemAggregatesManager,
    ...ItemQueryManager,
    ItemPoliciesService,
  ],
  exports: [ItemEntitiesModule, ...ItemAggregatesManager],
})
export class ItemModule {}
