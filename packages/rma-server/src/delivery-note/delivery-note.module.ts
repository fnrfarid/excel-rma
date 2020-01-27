import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteAggregatesManager } from './aggregates';
import { CqrsModule } from '@nestjs/cqrs';
import { DeliveryNoteEntitiesModule } from './entity/delivery-note-entity.module';
import { DeliveryNoteController } from './controller/delivery-note/delivery-note.controller';
import { DeliveryNoteWebhookController } from './controller/delivery-note-webhook/delivery-note-webhook.controller';
import { SerialNoEntitiesModule } from '../serial-no/entity/entity.module';
import { SalesInvoiceEntitiesModule } from '../sales-invoice/entity/entity.module';
import { DeliveryNoteQueryManager } from './queries';
import { DeliveryNoteCommandManager } from './commands';
import { DeliveryNoteEventManager } from './events';

@Module({
  imports: [
    DeliveryNoteEntitiesModule,
    CqrsModule,
    HttpModule,
    SerialNoEntitiesModule,
    SalesInvoiceEntitiesModule,
  ],
  controllers: [DeliveryNoteController, DeliveryNoteWebhookController],
  providers: [
    ...DeliveryNoteAggregatesManager,
    ...DeliveryNoteQueryManager,
    ...DeliveryNoteCommandManager,
    ...DeliveryNoteEventManager,
  ],
  exports: [DeliveryNoteEntitiesModule, ...DeliveryNoteAggregatesManager],
})
export class DeliveryNoteModule {}
