export interface ItemDefaults {
  company: string;
  default_warehouse: string;
  doctype: string;
}

export interface ItemWebhookInterface {
  creation: string;
  modified: string;
  name: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  disabled: number;
  description: string;
  shelf_life_in_days: number;
  end_of_life: string;
  default_material_request_type: string;
  has_serial_no: number;
  has_variants: number;
  is_purchase_item: number;
  min_order_qty: number;
  safety_stock: number;
  last_purchase_rate: number;
  country_of_origin: string;
  is_sales_item: number;
}

export interface ItemApiResponseInterface {
  creation: string;
  modified: string;
  name: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  disabled: number;
  description: string;
  shelf_life_in_days: number;
  end_of_life: string;
  default_material_request_type: string;
  has_serial_no: number;
  has_variants: number;
  is_purchase_item: number;
  min_order_qty: number;
  safety_stock: number;
  last_purchase_rate: number;
  country_of_origin: string;
  is_sales_item: number;
  barcodes: Barcodes[];
  uoms: Uom[];
  attributes: any[];
  item_defaults: ItemDefaults[];
  taxes: any[];
}

export interface Barcodes {
  name: string;
  idx: number;
  docstatus: number;
  barcode: string;
  barcode_type: string;
}

export interface Uom {
  name: string;
  idx: number;
  docstatus: number;
  conversion_factor: number;
  uom: string;
  doctype: string;
}
