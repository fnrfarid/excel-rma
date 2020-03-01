import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RetrievePurchaseOrderQuery } from './retrieve-purchase-order.query';
import { PurchaseOrderAggregateService } from '../../aggregates/purchase-order-aggregate/purchase-order-aggregate.service';

@QueryHandler(RetrievePurchaseOrderQuery)
export class RetrievePurchaseOrderQueryHandler
  implements IQueryHandler<RetrievePurchaseOrderQuery> {
  constructor(private readonly manager: PurchaseOrderAggregateService) {}

  async execute(query: RetrievePurchaseOrderQuery) {
    const { uuid } = query;
    return this.manager.retrievePurchaseOrder(uuid);
  }
}
