export interface DeliveryNoteWebhookInterface {
  name: string;
  modified_by: string;
  docstatus: 0;
  title: string;
  naming_series: string;
  customer: string;
  customer_name: string;
  company: string;
  posting_date: string;
  posting_time: string;
  is_return: number;
  currency: string;
  conversion_rate: number;
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  base_grand_total: number;
  customer_group: string;
  territory: string;
  items: DeliveryItemsInterface[];
  pricing_rules: DeliverPricingRulesInterface[];
  packed_items: DeliveryPackedItemsInterface[];
  taxes: DeliveryTaxesInterface[];
  sales_team: DeliverySalesTeamInterface[];
}
export interface DeliveryItemsInterface {
  name: string;
  item_code: string;
  item_name: string;
  description: string;
  is_nil_exempt: number;
  is_non_gst: number;
  item_group: string;
  image: string;
  qty: number;
  conversion_factor: number;
  stock_qty: number;
  price_list_rate: number;
  base_price_list_rate: number;
  rate: number;
  amount: number;
}
export interface DeliveryTaxesInterface {
  name: string;
  docstatus: number;
  charge_type: string;
  account_head: string;
  description: string;
  cost_center: string;
  rate: number;
  tax_amount: number;
  total: number;
}
export interface DeliverPricingRulesInterface {}
export interface DeliveryPackedItemsInterface {}
export interface DeliverySalesTeamInterface {}
