import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoRemovedEvent } from './serial-no-removed.event';
import { SerialNoHistoryService } from '../../entity/serial-no-history/serial-no-history.service';
import {
  EventType,
  SerialNoHistory,
} from '../../entity/serial-no-history/serial-no-history.entity';

@EventsHandler(SerialNoRemovedEvent)
export class SerialNoRemovedHandler
  implements IEventHandler<SerialNoRemovedEvent> {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
  ) {}

  handle(event: SerialNoRemovedEvent) {
    const { serialNo } = event;
    this.serialNoService
      .deleteOne({ uuid: serialNo.uuid })
      .then(success => {
        return this.serialNoHistoryService.create({
          ...serialNo,
          eventDate: new Date(),
          eventType: EventType.DeleteSerial,
        } as SerialNoHistory);
      })
      .then(updated => {})
      .catch(error => {});
  }
}
