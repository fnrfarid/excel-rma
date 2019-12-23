import { Module, HttpModule } from '@nestjs/common';
import { CustomerAggregatesManager } from './aggregates';
import { CustomerEntitiesModule } from './entity/entity.module';
import { CustomerQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { CustomerCommandManager } from './command';
import { CustomerEventManager } from './event';
import { CustomerController } from './controllers/customer/customer.controller';
import { CustomerPoliciesService } from './policies/customer-policies/customer-policies.service';
import { CustomerWebhookController } from './controllers/customer-webhook/customer-webhook.controller';

@Module({
  imports: [CustomerEntitiesModule, CqrsModule, HttpModule],
  controllers: [CustomerController, CustomerWebhookController],
  providers: [
    ...CustomerAggregatesManager,
    ...CustomerQueryManager,
    ...CustomerEventManager,
    ...CustomerCommandManager,
    CustomerPoliciesService,
  ],
  exports: [CustomerEntitiesModule, ...CustomerAggregatesManager],
})
export class CustomerModule {}
