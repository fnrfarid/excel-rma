import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import { PurchaseWarrantyDaysSetEvent } from './purchase-warranty-days-set.event';
import { ItemService } from '../../entity/item/item.service';

@EventsHandler(PurchaseWarrantyDaysSetEvent)
export class PurchaseWarrantyDaysSetHandler
  implements IEventHandler<PurchaseWarrantyDaysSetEvent> {
  constructor(private readonly itemService: ItemService) {}
  handle(event: PurchaseWarrantyDaysSetEvent) {
    const { item } = event;
    this.itemService
      .updateOne(
        { uuid: item.uuid },
        { $set: { purchaseWarrantyDays: item.purchaseWarrantyDays } },
      )
      .then(saved => {})
      .catch(error => {});
  }
}
