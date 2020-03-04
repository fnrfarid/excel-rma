import { SalesInvoiceAddedHandler } from './sales-invoice-added/sales-invoice-added.handler';
import { SalesInvoiceRemovedHandler } from './sales-invoice-removed/sales-invoice.removed.handler';
import { SalesInvoiceUpdatedHandler } from './sales-invoice-updated/sales-invoice-updated.handler';
import { SalesInvoiceSubmittedHandler } from './sales-invoice-submitted/sales-invoice-submitted.handler';
import { SalesInvoiceCanceledHandler } from './sales-invoice-canceled/sales-invoice-canceled.handler';
export const SalesInvoiceEventManager = [
  SalesInvoiceAddedHandler,
  SalesInvoiceRemovedHandler,
  SalesInvoiceUpdatedHandler,
  SalesInvoiceSubmittedHandler,
  SalesInvoiceCanceledHandler,
];
