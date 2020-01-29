import { Module, HttpModule } from '@nestjs/common';
import { PurchaseInvoiceAggregatesManager } from './aggregates';
import { PurchaseInvoiceEntitiesModule } from './entity/entity.module';
import { PurchaseInvoiceQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { PurchaseInvoiceCommandManager } from './command';
import { PurchaseInvoiceEventManager } from './event';
import { PurchaseInvoiceController } from './controllers/purchase-invoice/purchase-invoice.controller';
import { PurchaseInvoicePoliciesService } from './policies/purchase-invoice-policies/purchase-invoice-policies.service';
import { PurchaseInvoiceWebhookController } from './controllers/purchase-invoice-webhook/purchase-invoice-webhook.controller';

@Module({
  imports: [PurchaseInvoiceEntitiesModule, CqrsModule, HttpModule],
  controllers: [PurchaseInvoiceController, PurchaseInvoiceWebhookController],
  providers: [
    ...PurchaseInvoiceAggregatesManager,
    ...PurchaseInvoiceQueryManager,
    ...PurchaseInvoiceEventManager,
    ...PurchaseInvoiceCommandManager,
    PurchaseInvoicePoliciesService,
  ],
  exports: [PurchaseInvoiceEntitiesModule],
})
export class PurchaseInvoiceModule {}
