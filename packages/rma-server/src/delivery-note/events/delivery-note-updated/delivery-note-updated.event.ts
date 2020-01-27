import { IEvent } from '@nestjs/cqrs';
import { UpdateDeliveryNoteDto } from 'src/delivery-note/entity/delivery-note-service/update-delivery-note.dto';
export class DeliveryNoteUpdatedEvent implements IEvent {
  constructor(public updatePayload: UpdateDeliveryNoteDto) {}
}
