export const SUPPLIER_PROJECT_QUERY = {
  name: 1,
  supplier_name: 1,
  country: 1,
  supplier_type: 1,
  gst_category: 1,
  export_type: 1,
  uuid: 1,
  isSynced: 1,
};
export const CUSTOMER_PROJECT_QUERY = {
  name: 1,
  territory: 1,
  customer_group: 1,
  gst_category: 1,
  customer_type: 1,
  customer_name: 1,
  uuid: 1,
  isSynced: 1,
  credit_limits: 1,
};

export const ITEM_PROJECT_QUERY = {
  name: 1,
  item_code: 1,
  item_name: 1,
  item_group: 1,
  description: 1,
  end_of_life: 1,
  uuid: 1,
  isSynced: 1,
  attributes: 1,
  item_defaults: 1,
  taxes: 1,
  uoms: 1,
};
