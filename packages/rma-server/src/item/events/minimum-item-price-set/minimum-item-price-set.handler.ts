import { IEventHandler } from '@nestjs/cqrs';
import { MinimumItemPriceSetEvent } from './minimum-item-price-set.event';

export class MinimumItemPriceSetHandler
  implements IEventHandler<MinimumItemPriceSetEvent> {
  handle(event: MinimumItemPriceSetEvent) {}
}
