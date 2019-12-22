import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class SerialNoWebhookAggregateService extends AggregateRoot {
  constructor() {
    super();
  }
}
