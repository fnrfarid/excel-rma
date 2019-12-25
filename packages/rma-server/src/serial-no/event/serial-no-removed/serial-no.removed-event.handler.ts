import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoRemovedEvent } from './serial-no-removed.event';

@EventsHandler(SerialNoRemovedEvent)
export class SerialNoRemovedHandler
  implements IEventHandler<SerialNoRemovedEvent> {
  constructor(private readonly serialNoService: SerialNoService) {}
  async handle(event: SerialNoRemovedEvent) {
    const { serialNo } = event;
    await this.serialNoService.deleteOne({ uuid: serialNo.uuid });
  }
}
