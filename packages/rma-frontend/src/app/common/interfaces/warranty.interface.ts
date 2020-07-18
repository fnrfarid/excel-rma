import { Time } from '@angular/common';

export class WarrantyClaims {
  uuid: string;
  customer: string;
  company: string;
  addressDisplay: string;
  total: number;
  items: Array<Item>;
  claim_no: number;
  claim_status: string;
}

export class Item {
  customer?: string;
  uuid?: string;
  name?: string;
  owner?: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate?: number;
  amount?: number;
  minimumPrice?: number;
  description?: string;
  serial_no?: string[];
  delivery_note?: string;
  against_sales_invoice?: string;
  stock?: any;
  assigned?: number;
  remaining?: number;
  item_group?: string;
  brand?: string;
  item_defaults?: ItemDefaults;
  s_warehouse?: string;
  t_warehouse?: string;
}

export class ItemDefaults {
  name: string;
  owner: string;
  company: string;
  default_warehouse: string;
}
export class APIResponse {
  docs: any[];
  length: number;
  offset: number;
}

export interface SerialAssign {
  sales_invoice_name: string;
  set_warehouse: string;
  total_qty: number;
  total: number;
  posting_date: string;
  posting_time: string;
  customer: string;
  company: string;
  items: SerialNo[];
}

export interface SerialNo {
  item_code: string;
  qty: number;
  rate: number;
  amount: number;
  serial_no: string[];
}

export interface WarrantyClaimsDetails {
  warranty_end_date: Date;
  claim_type: string;
  received_on: Date;
  delivery_date: Date;
  receiving_branch: string;
  delivery_branch: string;
  address_display: string;
  received_by: string;
  delivered_by: string;
  serial_no: string;
  invoice_no: string;
  item_name: string;
  product_brand: string;
  problem: string;
  problem_details: string;
  remarks: string;
  customer: string;
  customer_contact: string;
  customer_address: string;
  third_party_name: string;
  third_party_contact: string;
  third_party_address: string;
  item_code: string;
  warranty_claim_date: Date;
  status_history?: StatusHistoryDetails[];
  posting_time: Date;
  uuid?: string;
}

export class WarrantyState {
  serial_no: { disabled: boolean; active: boolean };
  invoice_no: { disabled: boolean; active: boolean };
  warranty_end_date: { disabled: boolean; active: boolean };
  customer_contact: { disabled: boolean; active: boolean };
  customer_address: { disabled: boolean; active: boolean };
  product_name: { disabled: boolean; active: boolean };
  customer_name: { disabled: boolean; active: boolean };
  product_brand: { disabled: boolean; active: boolean };
  third_party_name: { disabled: boolean; active: boolean };
  third_party_contact: { disabled: boolean; active: boolean };
  third_party_address: { disabled: boolean; active: boolean };
}

export class Warranty {
  purchaseWarrantyDate: string;
  salesWarrantyDate: Date;
  purchasedOn: Date;
  soldOn: Date;
}
export class QueueState {
  purchase_receipt: {
    parent: string;
    warehouse: string;
  };
  delivery_note: {
    parent: string;
    warehouse: string;
  };
  stock_entry: {
    parent: string;
    source_warehouse: string;
    target_warehouse: string;
  };
}

export class SerialNoDetails {
  uuid?: string;
  isSynced?: boolean;
  warranty_expiry_date?: string;
  modified?: boolean;
  name?: string;
  owner?: string;
  creation?: string;
  sales_invoice_name?: string;
  serial_no?: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  purchase_time?: string;
  purchase_rate?: number;
  supplier?: string;
  customer?: string;
  warehouse?: string;
  delivery_note?: string;
  purchase_document_no?: string;
  sales_return_name?: string;
  purchase_document_type?: string;
  company?: string;
  warranty?: Warranty;
  purchase_date?: string;
  queue_state?: QueueState;
  purchase_invoice_name?: string;
  brand?: string;
}

export class StatusHistoryDetails {
  uuid?: string;
  posting_date?: Date;
  time?: Time;
  status_from?: string;
  transfer_branch?: string;
  verdict?: string;
  description?: string;
  delivery_status?: string;
  status?: string;
}

export class StockEntryDetails {
  company?: string;
  warrantyObjectUuid?: string;
  stock_entry_type?: string;
  posting_date?: string;
  posting_time?: string;
  doctype?: string;
  type?: string;
  description?: string;
  items?: StockItem[];
}

export class StockItem {
  s_warehouse?: string;
  t_warehouse?: string;
  transferWarehouse?: string;
  item_code?: string;
  item_name?: string;
  qty?: number;
  serial_no?: string[];
}
