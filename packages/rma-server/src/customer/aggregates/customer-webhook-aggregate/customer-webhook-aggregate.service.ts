import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class CustomerWebhookAggregateService extends AggregateRoot {
  constructor() {
    super();
  }

  customerCreate() {}
}
