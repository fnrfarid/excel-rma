import { Item } from './sales.interface';

export class PurchaseInvoice {
  uuid: string;
  status: string;
  supplier: string;
  total: number;
  items?: Array<Item>;
}

export class PurchaseInvoiceDetails {
  uuid?: string;
  name?: string;
  supplier: string;
  company: string;
  due_date: string;
  posting_date: string;
  posting_time?: string;
  address_display: string;
  buying_price_list?: string;
  total_qty?: number;
  total?: number;
  outstanding_amount?: number;
  status: string;
  submitted?: string;
  update_stock?: number;
  base_total?: number;
  net_total?: number;
  items?: Item[];
}
