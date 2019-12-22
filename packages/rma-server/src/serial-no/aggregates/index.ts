import { SerialNoAggregateService } from './serial-no-aggregate/serial-no-aggregate.service';
import { SerialNoWebhookAggregateService } from './serial-no-webhook-aggregate/serial-no-webhook-aggregate.service';

export const SerialNoAggregatesManager = [
  SerialNoAggregateService,
  SerialNoWebhookAggregateService,
];
