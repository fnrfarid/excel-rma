import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';

@Injectable()
export class PurchaseOrderAggregateService extends AggregateRoot {
  constructor(private readonly purchaseOrder: PurchaseOrderService) {
    super();
  }

  async retrievePurchaseOrder(uuid: string) {
    return await this.purchaseOrder.findOne({ uuid });
  }

  getPurchaseOrderList(
    offset: number,
    limit: number,
    sort: string,
    filter_query: any,
  ) {}
}
