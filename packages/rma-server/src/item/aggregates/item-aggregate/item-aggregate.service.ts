import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { ItemService } from '../../entity/item/item.service';
import { MinimumItemPriceSetEvent } from '../../events/minimum-item-price-set/minimum-item-price-set.event';
import { PurchaseWarrantyDaysSetEvent } from '../../events/purchase-warranty-days-set/purchase-warranty-days-set.event';

@Injectable()
export class ItemAggregateService extends AggregateRoot {
  constructor(private readonly itemService: ItemService) {
    super();
  }

  async retrieveItem(uuid: string, req) {
    const item = await this.itemService.findOne({ uuid });
    if (!item) throw new NotFoundException();
    return item;
  }

  async getItemList(offset, limit, sort, filterQuery, clientHttpRequest) {
    return this.itemService.list(offset, limit, sort, filterQuery);
  }

  async setMinPrice(uuid: string, minimumPrice: number) {
    const item = await this.itemService.findOne({ uuid });
    item.minimumPrice = minimumPrice;
    this.apply(new MinimumItemPriceSetEvent(item));
  }

  async setPurchaseWarrantyDays(uuid: string, purchaseWarrantyDays: number) {
    const item = await this.itemService.findOne({ uuid });
    item.purchaseWarrantyDays = purchaseWarrantyDays;
    this.apply(new PurchaseWarrantyDaysSetEvent(item));
  }

  async retrieveItemByCode(code: string, req) {
    const item = await this.itemService.findOne({ item_code: code });
    if (!item) throw new NotFoundException();
    return item;
  }

  async retrieveItemByNames(items_names: string[], req) {
    const item = await this.itemService.find({
      item_name: { $in: items_names },
    });
    if (!item) throw new NotFoundException();
    return item;
  }
}
