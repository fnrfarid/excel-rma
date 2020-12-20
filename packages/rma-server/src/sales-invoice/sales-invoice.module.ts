import { Module } from '@nestjs/common';
import { SalesInvoiceAggregatesManager } from './aggregates';
import { SalesInvoiceQueryManager } from './query';
import { SalesInvoiceCommandManager } from './command';
import { SalesInvoiceEventManager } from './event';
import { SalesInvoiceController } from './controllers/sales-invoice/sales-invoice.controller';
import { SalesInvoiceEntitiesModule } from './entity/entity.module';
import { CustomerModule } from '../customer/customer.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';
import { SerialNoModule } from '../serial-no/serial-no.module';
import { SalesInvoiceWebhookController } from './controllers/sales-invoice-webhook/sales-invoice-webhook.controller';
import { DirectModule } from '../direct/direct.module';
import { ItemEntitiesModule } from '../item/entity/item-entity.module';
import { SalesInvoicePoliciesManager } from './policies';

@Module({
  imports: [
    SalesInvoiceEntitiesModule,
    CustomerModule,
    DeliveryNoteModule,
    SerialNoModule,
    DirectModule,
    ItemEntitiesModule,
  ],
  controllers: [SalesInvoiceController, SalesInvoiceWebhookController],
  providers: [
    ...SalesInvoiceAggregatesManager,
    ...SalesInvoiceQueryManager,
    ...SalesInvoiceEventManager,
    ...SalesInvoiceCommandManager,
    ...SalesInvoicePoliciesManager,
  ],
  exports: [SalesInvoiceEntitiesModule],
})
export class SalesInvoiceModule {}
