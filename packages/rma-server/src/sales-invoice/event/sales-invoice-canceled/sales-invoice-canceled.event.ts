import { IEvent } from '@nestjs/cqrs';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';

export class SalesInvoiceCanceledEvent implements IEvent {
  constructor(public salesInvoice: SalesInvoice) {}
}
