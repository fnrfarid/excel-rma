import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { ItemService } from '../../entity/item/item.service';

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
}
