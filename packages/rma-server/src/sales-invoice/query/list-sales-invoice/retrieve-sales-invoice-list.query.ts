import { IQuery } from '@nestjs/cqrs';

export class RetrieveSalesInvoiceListQuery implements IQuery {
  constructor(
    public offset: number,
    public limit: number,
    public search: string,
    public sort: string,
  ) {}
}
