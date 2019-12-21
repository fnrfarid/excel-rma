import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RetrieveCustomerListQuery } from './retrieve-customer-list.query';
import { ItemAggregateService } from '../../aggregates/item-aggregate/item-aggregate.service';

@QueryHandler(RetrieveCustomerListQuery)
export class RetrieveItemListHandler
  implements IQueryHandler<RetrieveCustomerListQuery> {
  constructor(private readonly manager: ItemAggregateService) {}
  async execute(query: RetrieveCustomerListQuery) {
    const { offset, limit, search, sort, clientHttpRequest } = query;
    return await this.manager.getItemList(
      Number(offset),
      Number(limit),
      search,
      sort,
      clientHttpRequest,
    );
  }
}
