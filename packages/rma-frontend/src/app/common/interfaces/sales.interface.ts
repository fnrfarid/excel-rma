// import { Customer } from './customer.interface';

export class SalesInvoice {
  uuid: string;
  customer: string;
  company: string;
  addressDisplay: string;
  total: number;
  items: Array<Item>;
}

export class Item {
  itemCode: string;
  name: string;
  quantity: number;
  rate: number;
}

export class APIResponse {
  docs: any[];
  length: number;
  offset: number;
}
