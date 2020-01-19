import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteController } from './controller/delivery-note.controller';
import { DeliveryNoteService } from './entity/delivery-note-service/delivery-note.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryNote } from './entity/delivery-note-service/delivery-note.entity';
import { DeliveryNoteAggregatesManager } from './aggregates';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { SalesInvoiceEntitiesModule } from '../sales-invoice/entity/entity.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([DeliveryNote]),
    SerialNoEntitiesModule,
    SalesInvoiceEntitiesModule,
  ],
  controllers: [DeliveryNoteController],
  providers: [DeliveryNoteService, ...DeliveryNoteAggregatesManager],
  exports: [...DeliveryNoteAggregatesManager],
})
export class DeliveryNoteModule {}
