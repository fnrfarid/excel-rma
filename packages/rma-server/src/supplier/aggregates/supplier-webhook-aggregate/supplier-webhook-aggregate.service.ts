import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class SupplierWebhookAggregateService extends AggregateRoot {
  constructor() {
    super();
  }

  SupplierCreate() {}
}
