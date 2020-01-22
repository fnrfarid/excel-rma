export interface CreateDeliveryNoteInterface {
  docstatus?: 1;
  customer?: string;
  company?: string;
  posting_date?: string;
  posting_time?: string;
  is_return?: number;
  set_warehouse?: string;
  total_qty?: number;
  total?: number;
  items?: CreateDeliveryNoteItemInterface[];
  pricing_rules?: any[];
  packed_items?: any[];
  taxes?: any[];
  sales_team?: any[];
}

export interface CreateDeliveryNoteItemInterface {
  item_code?: string;
  qty?: number;
  rate?: number;
  amount?: number;
  against_sales_invoice?: string;
  serial_no?: any;
  // "12348\n12349\n12350"
}
