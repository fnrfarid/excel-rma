import { Item } from './sales.interface';

export interface SalesReturn {
  docstatus: number;
  customer: string;
  company: string;
  contact_email: string;
  posting_date: string;
  posting_time: string;
  is_return: boolean;
  set_warehouse: string;
  total_qty: number;
  total: number;
  items: Item[];
}
