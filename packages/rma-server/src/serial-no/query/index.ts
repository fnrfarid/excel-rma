import { RetrieveSerialNoHandler } from './get-serial-no/retrieve-serial-no-query.handler';
import { RetrieveSerialNoListHandler } from './list-serial-no/retrieve-serial-no-list-query.handler';
import { ValidateSerialsHandler } from './validate-serial/validate-serial-query.handler';
import { RetrieveSalesInvoiceDeliveredSerialNoQueryHandler } from './retrieve-sales-invoice-delivered-serial-no/retrieve-sales-invoice-delivered-serial-no.query.handler'; // eslint-disable-line
import { RetrieveDirectSerialNoHandler } from './get-direct-serial-no/retrieve-direct-serial-no-query.handler';

export const SerialNoQueryManager = [
  RetrieveSerialNoHandler,
  RetrieveSerialNoListHandler,
  ValidateSerialsHandler,
  RetrieveSalesInvoiceDeliveredSerialNoQueryHandler,
  RetrieveDirectSerialNoHandler,
];
