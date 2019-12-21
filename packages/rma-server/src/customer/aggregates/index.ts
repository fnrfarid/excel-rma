import { CustomerAggregateService } from './customer-aggregate/customer-aggregate.service';
import { CustomerWebhookAggregateService } from './customer-webhook-aggregate/customer-webhook-aggregate.service';

export const CustomerAggregatesManager = [
  CustomerAggregateService,
  CustomerWebhookAggregateService,
];
