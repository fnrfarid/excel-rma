import { SalesInvoiceAggregateService } from './sales-invoice-aggregate/sales-invoice-aggregate.service';
import { SalesInvoiceWebhookAggregateService } from './sales-invoice-webhook-aggregate/sales-invoice-webhook-aggregate.service';
import { CancelSalesInvoiceAggregateService } from './cancel-sales-invoice-aggregate/cancel-sales-invoice-aggregate.service';

export const SalesInvoiceAggregatesManager = [
  SalesInvoiceAggregateService,
  SalesInvoiceWebhookAggregateService,
  CancelSalesInvoiceAggregateService,
];
