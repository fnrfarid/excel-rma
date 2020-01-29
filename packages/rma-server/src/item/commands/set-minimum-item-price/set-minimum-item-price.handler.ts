import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { SetMinimumItemPriceCommand } from './set-minimum-item-price.command';

@CommandHandler(SetMinimumItemPriceCommand)
export class SetMinimumItemPriceHandler
  implements ICommandHandler<SetMinimumItemPriceCommand> {
  async execute(command: SetMinimumItemPriceCommand) {}
}
