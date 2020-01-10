import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteController } from './controller/delivery-note.controller';
import { DeliveryNoteService } from './delivery-note-service/delivery-note.service';
@Module({
  imports: [HttpModule],
  controllers: [DeliveryNoteController],
  providers: [DeliveryNoteService],
  exports: [],
})
export class DeliveryNoteModule {}
