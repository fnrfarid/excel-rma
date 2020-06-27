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
  serial_no?: string;
  delivery_note?: string;
  against_sales_invoice?: string;
  stock?: any;
  assigned?: number;
  remaining?: number;
  item_group?: string;
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
}
