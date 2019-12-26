import { IEvent } from '@nestjs/cqrs';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';

export class SalesInvoiceUpdatedEvent implements IEvent {
  constructor(public updatePayload: SalesInvoice) {}
}
