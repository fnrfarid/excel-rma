import { Module } from '@nestjs/common';
import { DeliveryNoteAggregatesManager } from './aggregates';
import { DeliveryNoteEntitiesModule } from './entity/delivery-note-entity.module';
import { DeliveryNoteController } from './controller/delivery-note/delivery-note.controller';
import { DeliveryNoteWebhookController } from './controller/delivery-note-webhook/delivery-note-webhook.controller';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { SalesInvoiceEntitiesModule } from '../sales-invoice/entity/entity.module';
import { DeliveryNoteCommandHandler } from './command';
import { DeliveryNoteQueryManager } from './queries';
import { DeliveryNoteCommandManager } from './commands';
import { DeliveryNoteEventManager } from './events';
import { DeliveryNoteJobService } from './schedular/delivery-note-job/delivery-note-job.service';
import { DirectModule } from '../direct/direct.module';

@Module({
  imports: [
    DeliveryNoteEntitiesModule,
    SerialNoEntitiesModule,
    SalesInvoiceEntitiesModule,
    DirectModule,
  ],
  controllers: [DeliveryNoteController, DeliveryNoteWebhookController],
  providers: [
    ...DeliveryNoteAggregatesManager,
    ...DeliveryNoteCommandHandler,
    ...DeliveryNoteQueryManager,
    ...DeliveryNoteCommandManager,
    ...DeliveryNoteEventManager,
    DeliveryNoteJobService,
  ],
  exports: [
    DeliveryNoteEntitiesModule,
    ...DeliveryNoteAggregatesManager,
    DeliveryNoteJobService,
  ],
})
export class DeliveryNoteModule {}
