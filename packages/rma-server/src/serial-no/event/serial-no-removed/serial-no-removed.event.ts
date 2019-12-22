import { IEvent } from '@nestjs/cqrs';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';

export class SerialNoRemovedEvent implements IEvent {
  constructor(public serialNo: SerialNo) {}
}
