import { AddSalesInvoiceHandler } from './add-sales-invoice/add-sales-invoice.handler';
import { RemoveSalesInvoiceHandler } from './remove-sales-invoice/remove-sales-invoice.handler';
import { UpdateSalesInvoiceHandler } from './update-sales-invoice/update-sales-invoice.handler';

export const SalesInvoiceCommandManager = [
  AddSalesInvoiceHandler,
  RemoveSalesInvoiceHandler,
  UpdateSalesInvoiceHandler,
];
