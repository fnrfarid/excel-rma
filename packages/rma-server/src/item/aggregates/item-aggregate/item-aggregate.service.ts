import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { ItemService } from '../../entity/item/item.service';
import { MinimumItemPriceSetEvent } from '../../events/minimum-item-price-set/minimum-item-price-set.event';
import { WarrantyMonthsSetEvent } from '../../events/purchase-warranty-days-set/purchase-warranty-days-set.event';
import { SetWarrantyMonthsDto } from '../../entity/item/set-warranty-months-dto';
import { ITEM_NOT_FOUND } from '../../../constants/messages';

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

  async updateItemHasSerialNo(has_serial_no: number, item_name: string) {
    const item = await this.itemService.findOne({ item_name });
    if (!item) {
      throw new NotFoundException(ITEM_NOT_FOUND);
    } else {
      return await this.itemService.updateOne(
        { item_name },
        { $set: { has_serial_no } },
      );
    }
  }

  async getItemList(offset, limit, sort, filterQuery, clientHttpRequest) {
    return this.itemService.list(offset, limit, sort, filterQuery);
  }

  async setMinPrice(uuid: string, minimumPrice: number) {
    const item = await this.itemService.findOne({ uuid });
    item.minimumPrice = minimumPrice;
    this.apply(new MinimumItemPriceSetEvent(item));
  }

  async setWarrantyMonths(uuid: string, updatePayload: SetWarrantyMonthsDto) {
    const item = await this.itemService.findOne({ uuid });
    if (!item) {
      throw new NotFoundException(ITEM_NOT_FOUND);
    }
    this.apply(new WarrantyMonthsSetEvent(updatePayload, uuid));
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
