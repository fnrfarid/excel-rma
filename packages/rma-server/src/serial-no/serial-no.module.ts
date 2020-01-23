import { Module, HttpModule } from '@nestjs/common';
import { SerialNoAggregatesManager } from './aggregates';
import { SerialNoEntitiesModule } from './entity/entity.module';
import { SerialNoQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { SerialNoCommandManager } from './command';
import { SerialNoEventManager } from './event';
import { SerialNoController } from './controllers/serial-no/serial-no.controller';
import { SerialNoPoliciesService } from './policies/serial-no-policies/serial-no-policies.service';
import { SerialNoWebhookController } from './controllers/serial-no-webhook/serial-no-webhook.controller';
import { ItemEntitiesModule } from '../item/entity/item-entity.module';
import { SupplierEntitiesModule } from '../supplier/entity/entity.module';
import { AssignSerialNoPoliciesService } from './policies/assign-serial-no-policies/assign-serial-no-policies.service';
import { SalesInvoiceEntitiesModule } from '../sales-invoice/entity/entity.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';

@Module({
  imports: [
    SerialNoEntitiesModule,
    CqrsModule,
    HttpModule,
    ItemEntitiesModule,
    SupplierEntitiesModule,
    SalesInvoiceEntitiesModule,
    DeliveryNoteModule,
  ],
  controllers: [SerialNoController, SerialNoWebhookController],
  providers: [
    ...SerialNoAggregatesManager,
    ...SerialNoQueryManager,
    ...SerialNoEventManager,
    ...SerialNoCommandManager,
    SerialNoPoliciesService,
    AssignSerialNoPoliciesService,
  ],
  exports: [
    SerialNoEntitiesModule,
    ...SerialNoAggregatesManager,
    AssignSerialNoPoliciesService,
  ],
})
export class SerialNoModule {}
