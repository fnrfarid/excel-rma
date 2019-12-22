import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdateSerialNoCommand } from './update-serial-no.command';
import { SerialNoAggregateService } from '../../aggregates/serial-no-aggregate/serial-no-aggregate.service';

@CommandHandler(UpdateSerialNoCommand)
export class UpdateSerialNoHandler
  implements ICommandHandler<UpdateSerialNoCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: SerialNoAggregateService,
  ) {}

  async execute(command: UpdateSerialNoCommand) {
    const { updatePayload } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await this.manager.updateSerialNo(updatePayload);
    aggregate.commit();
  }
}
