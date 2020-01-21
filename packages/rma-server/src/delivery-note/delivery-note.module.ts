import { Module, HttpModule } from '@nestjs/common';
import { DeliveryNoteAggregatesManager } from './aggregates';
import { CqrsModule } from '@nestjs/cqrs';
import { DeliveryNoteEntitiesModule } from './entity/delivery-note-entity.module';
import { DeliveryNoteController } from './controller/delivery-note/delivery-note.controller';
import { DeliveryNoteWebhookController } from './controller/delivery-note-webhook/delivery-note-webhook.controller';

@Module({
  imports: [DeliveryNoteEntitiesModule, CqrsModule, HttpModule],
  controllers: [DeliveryNoteController, DeliveryNoteWebhookController],
  providers: [...DeliveryNoteAggregatesManager],
  exports: [DeliveryNoteEntitiesModule, ...DeliveryNoteAggregatesManager],
})
export class DeliveryNoteModule {}
