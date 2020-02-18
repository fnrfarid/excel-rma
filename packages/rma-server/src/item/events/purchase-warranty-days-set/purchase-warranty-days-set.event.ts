import { IEvent } from '@nestjs/cqrs';
import { Item } from '../../entity/item/item.entity';

export class PurchaseWarrantyDaysSetEvent implements IEvent {
  constructor(public readonly item: Item) {}
}
