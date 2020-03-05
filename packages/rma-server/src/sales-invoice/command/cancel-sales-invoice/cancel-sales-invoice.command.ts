import { ICommand } from '@nestjs/cqrs';

export class CancelSalesInvoiceCommand implements ICommand {
  constructor(
    public readonly uuid: string,
    public readonly clientHttpReq: any,
  ) {}
}
