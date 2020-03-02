import { RetrieveSerialNoHandler } from './get-serial-no/retrieve-serial-no-query.handler';
import { RetrieveSerialNoListHandler } from './list-serial-no/retrieve-serial-no-list-query.handler';
import { ValidateSerialsHandler } from './validate-serial/validate-serial-query.handler';
import { RetrieveSalesInvoiceDeliveredSerialNoQueryHandler } from './retrieve-sales-invoice-delivered-serial-no/retrieve-sales-invoice-delivered-serial-no.query.handler'; // eslint-disable-line

export const SerialNoQueryManager = [
  RetrieveSerialNoHandler,
  RetrieveSerialNoListHandler,
  ValidateSerialsHandler,
  RetrieveSalesInvoiceDeliveredSerialNoQueryHandler,
];
