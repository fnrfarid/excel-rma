import { MinimumItemPriceSetHandler } from './minimum-item-price-set/minimum-item-price-set.handler';
import { PurchaseWarrantyDaysSetHandler } from './purchase-warranty-days-set/purchase-warranty-days-set.handler';

export const ItemEventHandlers = [
  MinimumItemPriceSetHandler,
  PurchaseWarrantyDaysSetHandler,
];
