import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteService } from './delivery-note-service/delivery-note.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryNote } from './delivery-note-service/delivery-note.entity';
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([DeliveryNote])],
  providers: [DeliveryNoteService],
  exports: [DeliveryNoteService],
})
export class DeliveryNoteEntitiesModule {}
