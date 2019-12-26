import { ICommand } from '@nestjs/cqrs';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';

export class UpdateSalesInvoiceCommand implements ICommand {
  constructor(public readonly updatePayload: SalesInvoice) {}
}
