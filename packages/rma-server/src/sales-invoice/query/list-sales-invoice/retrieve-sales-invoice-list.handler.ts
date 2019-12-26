import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RetrieveSalesInvoiceListQuery } from './retrieve-sales-invoice-list.query';
import { SalesInvoiceAggregateService } from '../../aggregates/sales-invoice-aggregate/sales-invoice-aggregate.service';

@QueryHandler(RetrieveSalesInvoiceListQuery)
export class RetrieveSalesInvoiceListHandler
  implements IQueryHandler<RetrieveSalesInvoiceListQuery> {
  constructor(private readonly manager: SalesInvoiceAggregateService) {}

  async execute(query: RetrieveSalesInvoiceListQuery) {
    const { offset, limit, search, sort } = query;

    return await this.manager.getSalesInvoiceList(
      Number(offset),
      Number(limit),
      search,
      sort,
    );
  }
}
