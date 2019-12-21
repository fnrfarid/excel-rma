export interface CustomerWebhookInterface {
  name: string;
  owner: string;
  customer_name: string;
  customer_type: string;
  gst_category: string;
  customer_group: string;
  territory: string;
}

export interface CreditLimitsInterface {
  company: string;
  credit_limit: string;
}
