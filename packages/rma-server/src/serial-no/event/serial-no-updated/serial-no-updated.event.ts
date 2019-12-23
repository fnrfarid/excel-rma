import { IEvent } from '@nestjs/cqrs';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';

export class SerialNoUpdatedEvent implements IEvent {
  constructor(public updatePayload: SerialNo) {}
}
