import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { AddSerialNoCommand } from './add-serial-no.command';
import { SerialNoAggregateService } from '../../aggregates/serial-no-aggregate/serial-no-aggregate.service';

@CommandHandler(AddSerialNoCommand)
export class AddSerialNoHandler implements ICommandHandler<AddSerialNoCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: SerialNoAggregateService,
  ) {}
  async execute(command: AddSerialNoCommand) {
    const { serialNoPayload, clientHttpRequest } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await aggregate.addSerialNo(serialNoPayload, clientHttpRequest);
    aggregate.commit();
  }
}
