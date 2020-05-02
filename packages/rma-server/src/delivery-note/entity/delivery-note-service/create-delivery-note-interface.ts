export interface CreateDeliveryNoteInterface {
  docstatus?: number;
  customer?: string;
  company?: string;
  posting_date?: string;
  posting_time?: string;
  is_return?: boolean;
  issue_credit_note?: boolean;
  return_against?: string;
  set_warehouse?: string;
  contact_email?: string;
  total_qty?: number;
  total?: number;
  items?: CreateDeliveryNoteItemInterface[];
  pricing_rules?: any[];
  packed_items?: any[];
  taxes?: any[];
  sales_team?: any[];
}

export interface CreateDeliveryNoteItemInterface {
  item_code: string;
  qty?: number;
  rate?: number;
  amount?: number;
  has_serial_no: number;
  warranty_date?: string;
  against_sales_invoice?: string;
  serial_no?: any;
}
