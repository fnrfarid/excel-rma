import { ICommandHandler, CommandHandler, EventPublisher } from '@nestjs/cqrs';
import { SetPurchaseWarrantyDaysCommand } from './set-purchase-warranty-days.command';
import { ItemAggregateService } from '../../aggregates/item-aggregate/item-aggregate.service';

@CommandHandler(SetPurchaseWarrantyDaysCommand)
export class SetPurchaseWarrantyDaysHandler
  implements ICommandHandler<SetPurchaseWarrantyDaysCommand> {
  constructor(
    private readonly manager: ItemAggregateService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SetPurchaseWarrantyDaysCommand) {
    const { uuid, days } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await aggregate.setPurchaseWarrantyDays(uuid, days);
    aggregate.commit();
  }
}
