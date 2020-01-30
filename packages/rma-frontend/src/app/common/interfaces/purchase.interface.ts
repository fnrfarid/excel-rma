import { Item } from './sales.interface';

export class PurchaseInvoice {
  uuid: string;
  status: string;
  supplier: string;
  total: number;
  items?: Array<Item>;
}
