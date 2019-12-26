import { SalesInvoiceAddedHandler } from './sales-invoice-added/sales-invoice-added.handler';
import { SalesInvoiceRemovedHandler } from './sales-invoice-removed/sales-invoice.removed.handler';
import { SalesInvoiceUpdatedHandler } from './sales-invoice-updated/sales-invoice-updated.handler';

export const SalesInvoiceEventManager = [
  SalesInvoiceAddedHandler,
  SalesInvoiceRemovedHandler,
  SalesInvoiceUpdatedHandler,
];
