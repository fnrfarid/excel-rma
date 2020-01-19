import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteController } from './controller/delivery-note.controller';
import { DeliveryNoteService } from './entity/delivery-note-service/delivery-note.service';
import { DeliveryNoteAggregateService } from './aggregates/delivery-note-aggregate/delivery-note-aggregate.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryNote } from './entity/delivery-note-service/delivery-note.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([DeliveryNote])],
  controllers: [DeliveryNoteController],
  providers: [DeliveryNoteService, DeliveryNoteAggregateService],
  exports: [],
})
export class DeliveryNoteModule {}
