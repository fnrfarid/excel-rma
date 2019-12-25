import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RemoveSerialNoCommand } from './remove-serial-no.command';
import { SerialNoAggregateService } from '../../aggregates/serial-no-aggregate/serial-no-aggregate.service';

@CommandHandler(RemoveSerialNoCommand)
export class RemoveSerialNoHandler
  implements ICommandHandler<RemoveSerialNoCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly manager: SerialNoAggregateService,
  ) {}
  async execute(command: RemoveSerialNoCommand) {
    const { uuid } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await this.manager.removeSerialNo(uuid);
    aggregate.commit();
  }
}
