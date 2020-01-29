import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { ItemService } from '../../entity/item/item.service';
import { MinimumItemPriceSetEvent } from '../../events/minimum-item-price-set/minimum-item-price-set.event';

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

  async getItemList(offset, limit, sort, search, clientHttpRequest) {
    let sortQuery = { name: 'ASC' };
    if (sort) sortQuery = { name: sort.toUpperCase() };
    return this.itemService.list(offset, limit, search, sortQuery);
  }

  async setMinPrice(uuid: string, minimumPrice: number) {
    const item = await this.itemService.findOne({ uuid });
    item.minimumPrice = minimumPrice;
    this.apply(new MinimumItemPriceSetEvent(item));
  }
}
