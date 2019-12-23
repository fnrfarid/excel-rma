import { RetrieveSerialNoHandler } from './get-serial-no/retrieve-serial-no-query.handler';
import { RetrieveSerialNoListHandler } from './list-serial-no/retrieve-serial-no-list-query.handler';

export const SerialNoQueryManager = [
  RetrieveSerialNoHandler,
  RetrieveSerialNoListHandler,
];
