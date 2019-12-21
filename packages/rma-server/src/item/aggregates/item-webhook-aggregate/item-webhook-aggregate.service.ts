import { AggregateRoot } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ItemWebhookAggregateService extends AggregateRoot {
  constructor() {
    super();
  }
}
