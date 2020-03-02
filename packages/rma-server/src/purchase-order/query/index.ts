import { RetrievePurchaseOrderQuery } from './get-purchase-order/retrieve-purchase-order.query';
import { RetrievePurchaseOrderListQueryHandler } from './list-purchase-order/retrieve-purchase-order-list.handler';

export const PurchaseOrderQueries = [
  RetrievePurchaseOrderQuery,
  RetrievePurchaseOrderListQueryHandler,
];
