import { RetrieveItemHandler } from './get-item/retrieve-item-query.handler';
import { RetrieveItemListHandler } from './list-customer/retrieve-customer-list-query.handler';

export const ItemQueryManager = [RetrieveItemHandler, RetrieveItemListHandler];
