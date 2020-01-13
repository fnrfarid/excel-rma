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
  name?: string;
  owner?: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount?: number;
}

export class APIResponse {
  docs: any[];
  length: number;
  offset: number;
}
