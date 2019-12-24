import { RetrieveItemHandler } from './get-item/retrieve-item-query.handler';
import { RetrieveItemListHandler } from './list-item/retrieve-item-list-query.handler';

export const ItemQueryManager = [RetrieveItemHandler, RetrieveItemListHandler];
