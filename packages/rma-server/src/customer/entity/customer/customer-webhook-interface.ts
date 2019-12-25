export interface CustomerWebhookInterface {
  name: string;
  owner: string;
  customer_name: string;
  customer_type: string;
  gst_category: string;
  customer_group: string;
  territory: string;
  isSynced?: boolean;
}

export interface CreditLimitsInterface {
  company: string;
  credit_limit: string;
}
