import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoUpdatedEvent } from './serial-no-updated.event';
import {
  EventType,
  SerialNoHistory,
} from '../../entity/serial-no-history/serial-no-history.entity';
import { SerialNoHistoryService } from '../../entity/serial-no-history/serial-no-history.service';

@EventsHandler(SerialNoUpdatedEvent)
export class SerialNoUpdatedHandler
  implements IEventHandler<SerialNoUpdatedEvent> {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
  ) {}

  handle(event: SerialNoUpdatedEvent) {
    const { updatePayload } = event;
    this.serialNoService
      .updateOne({ uuid: updatePayload.uuid }, { $set: updatePayload })
      .then(success => {
        return this.serialNoHistoryService.create({
          ...updatePayload,
          eventDate: new Date(),
          eventType: EventType.UpdateSerial,
        } as SerialNoHistory);
      })
      .then(updated => {})
      .catch(error => {});
  }
}
