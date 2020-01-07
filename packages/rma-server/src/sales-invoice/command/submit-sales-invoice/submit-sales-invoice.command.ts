import { ICommand } from '@nestjs/cqrs';
import { SalesInvoiceUpdateDto } from '../../../sales-invoice/entity/sales-invoice/sales-invoice-update-dto';

export class SubmitSalesInvoiceCommand implements ICommand {
  constructor(
    public readonly updatePayload: SalesInvoiceUpdateDto,
    public readonly clientHttpReq: any,
  ) {}
}
