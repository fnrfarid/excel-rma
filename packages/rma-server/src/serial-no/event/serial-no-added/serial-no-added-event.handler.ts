import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SerialNoAddedEvent } from './serial-no-added.event';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';

@EventsHandler(SerialNoAddedEvent)
export class SerialNoAddedHandler implements IEventHandler<SerialNoAddedEvent> {
  constructor(private readonly serialNoService: SerialNoService) {}
  async handle(event: SerialNoAddedEvent) {
    const { serialNo } = event;
    await this.serialNoService.create(serialNo);
  }
}
