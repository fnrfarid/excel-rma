import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoUpdatedEvent } from './serial-no-updated.event';

@EventsHandler(SerialNoUpdatedEvent)
export class SerialNoUpdatedHandler
  implements IEventHandler<SerialNoUpdatedEvent> {
  constructor(private readonly serialNoService: SerialNoService) {}

  async handle(event: SerialNoUpdatedEvent) {
    const { updatePayload } = event;
    await this.serialNoService.updateOne(
      { uuid: updatePayload.uuid },
      { $set: updatePayload },
    );
  }
}
