import { Module } from '@nestjs/common';
import { SalesInvoiceAggregatesManager } from './aggregates';
import { SalesInvoiceQueryManager } from './query';
import { SalesInvoiceCommandManager } from './command';
import { SalesInvoiceEventManager } from './event';
import { SalesInvoiceController } from './controllers/sales-invoice/sales-invoice.controller';
import { SalesInvoicePoliciesService } from './policies/sales-invoice-policies/sales-invoice-policies.service';
import { SalesInvoiceEntitiesModule } from './entity/entity.module';
import { CustomerModule } from '../customer/customer.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';
import { SerialNoModule } from '../serial-no/serial-no.module';
import { SalesInvoiceWebhookController } from './controllers/sales-invoice-webhook/sales-invoice-webhook.controller';
import { ErrorLogModule } from '../error-log/error-logs-invoice.module';

@Module({
  imports: [
    SalesInvoiceEntitiesModule,
    CustomerModule,
    DeliveryNoteModule,
    SerialNoModule,
    ErrorLogModule,
  ],
  controllers: [SalesInvoiceController, SalesInvoiceWebhookController],
  providers: [
    ...SalesInvoiceAggregatesManager,
    ...SalesInvoiceQueryManager,
    ...SalesInvoiceEventManager,
    ...SalesInvoiceCommandManager,
    SalesInvoicePoliciesService,
  ],
  exports: [SalesInvoiceEntitiesModule],
})
export class SalesInvoiceModule {}
