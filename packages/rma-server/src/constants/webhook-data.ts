export function getBearerTokenOnTrashWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'OAuth Bearer Token',
    webhook_docevent: 'on_trash',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'client',
        key: 'client',
      },
      {
        fieldname: 'user',
        key: 'user',
      },
      {
        fieldname: 'scopes',
        key: 'scopes',
      },
      {
        fieldname: 'access_token',
        key: 'access_token',
      },
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'status',
        key: 'status',
      },
      {
        fieldname: 'expires_in',
        key: 'expires_in',
      },
      {
        fieldname: 'refresh_token',
        key: 'refresh_token',
      },
    ],
  };
}

export function getBearerTokenAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
  webhookDocevent = 'after_insert',
) {
  return {
    webhook_doctype: 'OAuth Bearer Token',
    webhook_docevent: webhookDocevent,
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'client',
        key: 'client',
      },
      {
        fieldname: 'user',
        key: 'user',
      },
      {
        fieldname: 'scopes',
        key: 'scopes',
      },
      {
        fieldname: 'access_token',
        key: 'access_token',
      },
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'status',
        key: 'status',
      },
      {
        fieldname: 'expires_in',
        key: 'expires_in',
      },
      {
        fieldname: 'refresh_token',
        key: 'refresh_token',
      },
    ],
  };
}

export function getSupplierAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Supplier',
    webhook_docevent: 'after_insert',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'supplier_name',
        key: 'supplier_name',
      },
      {
        fieldname: 'country',
        key: 'country',
      },
      {
        fieldname: 'default_bank_account',
        key: 'default_bank_account',
      },
      {
        fieldname: 'tax_id',
        key: 'tax_id',
      },
      {
        fieldname: 'tax_category',
        key: 'tax_category',
      },
      {
        fieldname: 'supplier_type',
        key: 'supplier_type',
      },
      {
        fieldname: 'is_internal_supplier',
        key: 'is_internal_supplier',
      },
      {
        fieldname: 'represents_company',
        key: 'represents_company',
      },
      {
        fieldname: 'pan',
        key: 'pan',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'export_type',
        key: 'export_type',
      },
    ],
  };
}

export function getSupplierOnUpdateWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Supplier',
    webhook_docevent: 'on_update',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'supplier_name',
        key: 'supplier_name',
      },
      {
        fieldname: 'country',
        key: 'country',
      },
      {
        fieldname: 'default_bank_account',
        key: 'default_bank_account',
      },
      {
        fieldname: 'tax_id',
        key: 'tax_id',
      },
      {
        fieldname: 'tax_category',
        key: 'tax_category',
      },
      {
        fieldname: 'supplier_type',
        key: 'supplier_type',
      },
      {
        fieldname: 'is_internal_supplier',
        key: 'is_internal_supplier',
      },
      {
        fieldname: 'represents_company',
        key: 'represents_company',
      },
      {
        fieldname: 'pan',
        key: 'pan',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'export_type',
        key: 'export_type',
      },
    ],
  };
}

export function getSupplierOnTrashWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Supplier',
    webhook_docevent: 'on_trash',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'supplier_name',
        key: 'supplier_name',
      },
      {
        fieldname: 'country',
        key: 'country',
      },
      {
        fieldname: 'default_bank_account',
        key: 'default_bank_account',
      },
      {
        fieldname: 'tax_id',
        key: 'tax_id',
      },
      {
        fieldname: 'tax_category',
        key: 'tax_category',
      },
      {
        fieldname: 'supplier_type',
        key: 'supplier_type',
      },
      {
        fieldname: 'is_internal_supplier',
        key: 'is_internal_supplier',
      },
      {
        fieldname: 'represents_company',
        key: 'represents_company',
      },
      {
        fieldname: 'pan',
        key: 'pan',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'export_type',
        key: 'export_type',
      },
    ],
  };
}

export function getCustomerAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Customer',
    webhook_docevent: 'after_insert',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'customer_type',
        key: 'customer_type',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
      {
        fieldname: 'credit_limits',
        key: 'credit_limits',
      },
      {
        fieldname: 'payment_terms',
        key: 'payment_terms',
      },
      {
        fieldname: 'sales_team',
        key: 'sales_team',
      },
    ],
  };
}

export function getCustomerOnUpdateWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Customer',
    webhook_docevent: 'on_update',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'customer_type',
        key: 'customer_type',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
      {
        fieldname: 'credit_limits',
        key: 'credit_limits',
      },
      {
        fieldname: 'payment_terms',
        key: 'payment_terms',
      },
      {
        fieldname: 'sales_team',
        key: 'sales_team',
      },
    ],
  };
}

export function getCustomerOnTrashWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Customer',
    webhook_docevent: 'on_trash',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'gst_category',
        key: 'gst_category',
      },
      {
        fieldname: 'customer_type',
        key: 'customer_type',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
    ],
  };
}

export function getItemAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Item',
    webhook_docevent: 'after_insert',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'item_code',
        key: 'item_code',
      },
      {
        fieldname: 'item_name',
        key: 'item_name',
      },
      {
        fieldname: 'item_group',
        key: 'item_group',
      },
      {
        fieldname: 'stock_uom',
        key: 'stock_uom',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'creation',
        key: 'creation',
      },
      {
        fieldname: 'modified',
        key: 'modified',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'description',
        key: 'description',
      },
      {
        fieldname: 'shelf_life_in_days',
        key: 'shelf_life_in_days',
      },
      {
        fieldname: 'end_of_life',
        key: 'end_of_life',
      },
      {
        fieldname: 'default_material_request_type',
        key: 'default_material_request_type',
      },
      {
        fieldname: 'has_variants',
        key: 'has_variants',
      },
      {
        fieldname: 'has_serial_no',
        key: 'has_serial_no',
      },
      {
        fieldname: 'is_purchase_item',
        key: 'is_purchase_item',
      },
      {
        fieldname: 'min_order_qty',
        key: 'min_order_qty',
      },
      {
        fieldname: 'brand',
        key: 'brand',
      },
    ],
  };
}

export function getItemOnUpdateWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Item',
    webhook_docevent: 'on_update',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'item_code',
        key: 'item_code',
      },
      {
        fieldname: 'item_name',
        key: 'item_name',
      },
      {
        fieldname: 'item_group',
        key: 'item_group',
      },
      {
        fieldname: 'stock_uom',
        key: 'stock_uom',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'creation',
        key: 'creation',
      },
      {
        fieldname: 'modified',
        key: 'modified',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'description',
        key: 'description',
      },
      {
        fieldname: 'shelf_life_in_days',
        key: 'shelf_life_in_days',
      },
      {
        fieldname: 'end_of_life',
        key: 'end_of_life',
      },
      {
        fieldname: 'default_material_request_type',
        key: 'default_material_request_type',
      },
      {
        fieldname: 'has_variants',
        key: 'has_variants',
      },
      {
        fieldname: 'has_serial_no',
        key: 'has_serial_no',
      },
      {
        fieldname: 'is_purchase_item',
        key: 'is_purchase_item',
      },
      {
        fieldname: 'min_order_qty',
        key: 'min_order_qty',
      },
      {
        fieldname: 'brand',
        key: 'brand',
      },
    ],
  };
}

export function getItemOnTrashWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Item',
    webhook_docevent: 'on_trash',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'item_code',
        key: 'item_code',
      },
      {
        fieldname: 'item_name',
        key: 'item_name',
      },
      {
        fieldname: 'item_group',
        key: 'item_group',
      },
      {
        fieldname: 'stock_uom',
        key: 'stock_uom',
      },
      {
        fieldname: 'disabled',
        key: 'disabled',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
      {
        fieldname: 'creation',
        key: 'creation',
      },
      {
        fieldname: 'modified',
        key: 'modified',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'description',
        key: 'description',
      },
      {
        fieldname: 'shelf_life_in_days',
        key: 'shelf_life_in_days',
      },
      {
        fieldname: 'end_of_life',
        key: 'end_of_life',
      },
      {
        fieldname: 'default_material_request_type',
        key: 'default_material_request_type',
      },
      {
        fieldname: 'has_variants',
        key: 'has_variants',
      },
      {
        fieldname: 'has_serial_no',
        key: 'has_serial_no',
      },
      {
        fieldname: 'is_purchase_item',
        key: 'is_purchase_item',
      },
      {
        fieldname: 'min_order_qty',
        key: 'min_order_qty',
      },
      {
        fieldname: 'brand',
        key: 'brand',
      },
    ],
  };
}

export function deliveryNoteNoAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Delivery Note',
    webhook_docevent: 'after_insert',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'title',
        key: 'title',
      },
      {
        fieldname: 'naming_series',
        key: 'naming_series',
      },
      {
        fieldname: 'customer',
        key: 'customer',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
      {
        fieldname: 'company',
        key: 'company',
      },
      {
        fieldname: 'posting_date',
        key: 'posting_date',
      },
      {
        fieldname: 'posting_time',
        key: 'posting_time',
      },
      {
        fieldname: 'is_return',
        key: 'is_return',
      },
      {
        fieldname: 'currency',
        key: 'currency',
      },
      {
        fieldname: 'conversion_rate',
        key: 'conversion_rate',
      },
      {
        fieldname: 'total_qty',
        key: 'total_qty',
      },
      {
        fieldname: 'base_total',
        key: 'base_total',
      },
      {
        fieldname: 'base_net_total',
        key: 'base_net_total',
      },
      {
        fieldname: 'total',
        key: 'total',
      },
      {
        fieldname: 'net_total',
        key: 'net_total',
      },
      {
        fieldname: 'base_grand_total',
        key: 'base_grand_total',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'items',
        key: 'items',
      },
      {
        fieldname: 'pricing_rules',
        key: 'pricing_rules',
      },
      {
        fieldname: 'packed_items',
        key: 'packed_items',
      },
      {
        fieldname: 'taxes',
        key: 'taxes',
      },
      {
        fieldname: 'sales_team',
        key: 'sales_team',
      },
    ],
  };
}

export function deliveryNoteOnUpdateWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Delivery Note',
    webhook_docevent: 'on_update',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'title',
        key: 'title',
      },
      {
        fieldname: 'naming_series',
        key: 'naming_series',
      },
      {
        fieldname: 'customer',
        key: 'customer',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
      {
        fieldname: 'company',
        key: 'company',
      },
      {
        fieldname: 'posting_date',
        key: 'posting_date',
      },
      {
        fieldname: 'posting_time',
        key: 'posting_time',
      },
      {
        fieldname: 'is_return',
        key: 'is_return',
      },
      {
        fieldname: 'currency',
        key: 'currency',
      },
      {
        fieldname: 'conversion_rate',
        key: 'conversion_rate',
      },
      {
        fieldname: 'total_qty',
        key: 'total_qty',
      },
      {
        fieldname: 'base_total',
        key: 'base_total',
      },
      {
        fieldname: 'base_net_total',
        key: 'base_net_total',
      },
      {
        fieldname: 'total',
        key: 'total',
      },
      {
        fieldname: 'net_total',
        key: 'net_total',
      },
      {
        fieldname: 'base_grand_total',
        key: 'base_grand_total',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'items',
        key: 'items',
      },
      {
        fieldname: 'pricing_rules',
        key: 'pricing_rules',
      },
      {
        fieldname: 'packed_items',
        key: 'packed_items',
      },
      {
        fieldname: 'taxes',
        key: 'taxes',
      },
      {
        fieldname: 'sales_team',
        key: 'sales_team',
      },
    ],
  };
}

export function deliveryNoteOnTrashWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Delivery Note',
    webhook_docevent: 'on_trash',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'modified_by',
        key: 'modified_by',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'title',
        key: 'title',
      },
      {
        fieldname: 'naming_series',
        key: 'naming_series',
      },
      {
        fieldname: 'customer',
        key: 'customer',
      },
      {
        fieldname: 'customer_name',
        key: 'customer_name',
      },
      {
        fieldname: 'company',
        key: 'company',
      },
      {
        fieldname: 'posting_date',
        key: 'posting_date',
      },
      {
        fieldname: 'posting_time',
        key: 'posting_time',
      },
      {
        fieldname: 'is_return',
        key: 'is_return',
      },
      {
        fieldname: 'currency',
        key: 'currency',
      },
      {
        fieldname: 'conversion_rate',
        key: 'conversion_rate',
      },
      {
        fieldname: 'total_qty',
        key: 'total_qty',
      },
      {
        fieldname: 'base_total',
        key: 'base_total',
      },
      {
        fieldname: 'base_net_total',
        key: 'base_net_total',
      },
      {
        fieldname: 'total',
        key: 'total',
      },
      {
        fieldname: 'net_total',
        key: 'net_total',
      },
      {
        fieldname: 'base_grand_total',
        key: 'base_grand_total',
      },
      {
        fieldname: 'customer_group',
        key: 'customer_group',
      },
      {
        fieldname: 'territory',
        key: 'territory',
      },
      {
        fieldname: 'items',
        key: 'items',
      },
      {
        fieldname: 'pricing_rules',
        key: 'pricing_rules',
      },
      {
        fieldname: 'packed_items',
        key: 'packed_items',
      },
      {
        fieldname: 'taxes',
        key: 'taxes',
      },
      {
        fieldname: 'sales_team',
        key: 'sales_team',
      },
    ],
  };
}

export function purchaseInvoiceOnSubmitWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Purchase Invoice',
    webhook_docevent: 'on_submit',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        fieldname: 'name',
        key: 'name',
      },
      {
        fieldname: 'docstatus',
        key: 'docstatus',
      },
      {
        fieldname: 'title',
        key: 'title',
      },
      {
        fieldname: 'naming_series',
        key: 'naming_series',
      },
      {
        fieldname: 'supplier',
        key: 'supplier',
      },
      {
        fieldname: 'supplier_name',
        key: 'supplier_name',
      },
      {
        fieldname: 'due_date',
        key: 'due_date',
      },
      {
        fieldname: 'is_paid',
        key: 'is_paid',
      },
      {
        fieldname: 'is_return',
        key: 'is_return',
      },
      {
        fieldname: 'company',
        key: 'company',
      },
      {
        fieldname: 'posting_date',
        key: 'posting_date',
      },
      {
        fieldname: 'posting_time',
        key: 'posting_time',
      },
      {
        fieldname: 'supplier_address',
        key: 'supplier_address',
      },
      {
        fieldname: 'address_display',
        key: 'address_display',
      },
      {
        fieldname: 'buying_price_list',
        key: 'buying_price_list',
      },
      {
        fieldname: 'update_stock',
        key: 'update_stock',
      },
      {
        fieldname: 'total_qty',
        key: 'total_qty',
      },
      {
        fieldname: 'base_total',
        key: 'base_total',
      },
      {
        fieldname: 'total',
        key: 'total',
      },
      {
        fieldname: 'in_words',
        key: 'in_words',
      },
      {
        fieldname: 'total_advance',
        key: 'total_advance',
      },
      {
        fieldname: 'outstanding_amount',
        key: 'outstanding_amount',
      },
      {
        fieldname: 'paid_amount',
        key: 'paid_amount',
      },
      {
        fieldname: 'credit_to',
        key: 'credit_to',
      },
      {
        fieldname: 'against_expense_account',
        key: 'against_expense_account',
      },
      {
        fieldname: 'items',
        key: 'items',
      },
      {
        fieldname: 'pricing_rules',
        key: 'pricing_rules',
      },
      {
        fieldname: 'supplied_items',
        key: 'supplied_items',
      },
      {
        fieldname: 'taxes',
        key: 'taxes',
      },
      {
        fieldname: 'advances',
        key: 'advances',
      },
      {
        fieldname: 'payment_schedule',
        key: 'payment_schedule',
      },
      {
        fieldname: 'owner',
        key: 'owner',
      },
    ],
  };
}

export function salesInvoiceOnSubmitWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Sales Invoice',
    webhook_docevent: 'on_submit',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        key: 'name',
        fieldname: 'name',
      },
      {
        key: 'is_return',
        fieldname: 'is_return',
      },
      {
        key: 'issue_credit_note',
        fieldname: 'issue_credit_note',
      },
      {
        key: 'title',
        fieldname: 'title',
      },
      {
        key: 'customer',
        fieldname: 'customer',
      },
      {
        key: 'company',
        fieldname: 'company',
      },
      {
        fieldname: 'outstanding_amount',
        key: 'outstanding_amount',
      },
      {
        key: 'posting_date',
        fieldname: 'posting_date',
      },
      {
        key: 'posting_time',
        fieldname: 'posting_time',
      },
      {
        key: 'set_posting_time',
        fieldname: 'set_posting_time',
      },
      {
        key: 'due_date',
        fieldname: 'due_date',
      },
      {
        key: 'address_display',
        fieldname: 'address_display',
      },
      {
        key: 'contact_person',
        fieldname: 'contact_person',
      },
      {
        key: 'contact_display',
        fieldname: 'contact_display',
      },
      {
        key: 'contact_email',
        fieldname: 'contact_email',
      },
      {
        key: 'territory',
        fieldname: 'territory',
      },
      {
        key: 'update_stock',
        fieldname: 'update_stock',
      },
      {
        key: 'total_qty',
        fieldname: 'total_qty',
      },
      {
        key: 'base_total',
        fieldname: 'base_total',
      },
      {
        key: 'base_net_total',
        fieldname: 'base_net_total',
      },
      {
        key: 'total',
        fieldname: 'total',
      },
      {
        key: 'net_total',
        fieldname: 'net_total',
      },
      {
        key: 'pos_total_qty',
        fieldname: 'pos_total_qty',
      },
      {
        key: 'items',
        fieldname: 'items',
      },
      {
        key: 'pricing_rules',
        fieldname: 'pricing_rules',
      },
      {
        key: 'packed_items',
        fieldname: 'packed_items',
      },
      {
        key: 'timesheets',
        fieldname: 'timesheets',
      },
      {
        key: 'taxes',
        fieldname: 'taxes',
      },
      {
        key: 'advances',
        fieldname: 'advances',
      },
      {
        key: 'payment_schedule',
        fieldname: 'payment_schedule',
      },
      {
        key: 'payments',
        fieldname: 'payments',
      },
      {
        key: 'sales_team',
        fieldname: 'sales_team',
      },
      {
        key: 'remarks',
        fieldname: 'remarks',
      },
    ],
  };
}

export function salesInvoiceOnCancelWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Sales Invoice',
    webhook_docevent: 'on_cancel',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      {
        key: 'name',
        fieldname: 'name',
      },
    ],
  };
}

export function purchaseOrderOnSubmitWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Purchase Order',
    webhook_docevent: 'on_submit',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      { fieldname: 'name', key: 'name' },
      { fieldname: 'owner', key: 'owner' },
      { fieldname: 'creation', key: 'creation' },
      { fieldname: 'modified', key: 'modified' },
      { fieldname: 'modified_by', key: 'modified_by' },
      { fieldname: 'idx', key: 'idx' },
      { fieldname: 'docstatus', key: 'docstatus' },
      { fieldname: 'title', key: 'title' },
      { fieldname: 'naming_series', key: 'naming_series' },
      { fieldname: 'supplier', key: 'supplier' },
      { fieldname: 'supplier_name', key: 'supplier_name' },
      { fieldname: 'company', key: 'company' },
      { fieldname: 'transaction_date', key: 'transaction_date' },
      { fieldname: 'schedule_date', key: 'schedule_date' },
      { fieldname: 'supplier_address', key: 'supplier_address' },
      { fieldname: 'address_display', key: 'address_display' },
      { fieldname: 'currency', key: 'currency' },
      { fieldname: 'conversion_rate', key: 'conversion_rate' },
      { fieldname: 'buying_price_list', key: 'buying_price_list' },
      { fieldname: 'price_list_currency', key: 'price_list_currency' },
      { fieldname: 'plc_conversion_rate', key: 'plc_conversion_rate' },
      { fieldname: 'ignore_pricing_rule', key: 'ignore_pricing_rule' },
      { fieldname: 'is_subcontracted', key: 'is_subcontracted' },
      { fieldname: 'total_qty', key: 'total_qty' },
      { fieldname: 'base_total', key: 'base_total' },
      { fieldname: 'base_net_total', key: 'base_net_total' },
      { fieldname: 'total', key: 'total' },
      { fieldname: 'net_total', key: 'net_total' },
      { fieldname: 'total_net_weight', key: 'total_net_weight' },
      {
        fieldname: 'base_taxes_and_charges_added',
        key: 'base_taxes_and_charges_added',
      },
      {
        fieldname: 'base_taxes_and_charges_deducted',
        key: 'base_taxes_and_charges_deducted',
      },
      {
        fieldname: 'base_total_taxes_and_charges',
        key: 'base_total_taxes_and_charges',
      },
      { fieldname: 'taxes_and_charges_added', key: 'taxes_and_charges_added' },
      {
        fieldname: 'taxes_and_charges_deducted',
        key: 'taxes_and_charges_deducted',
      },
      { fieldname: 'total_taxes_and_charges', key: 'total_taxes_and_charges' },
      { fieldname: 'apply_discount_on', key: 'apply_discount_on' },
      { fieldname: 'base_discount_amount', key: 'base_discount_amount' },
      {
        fieldname: 'additional_discount_percentage',
        key: 'additional_discount_percentage',
      },
      { fieldname: 'discount_amount', key: 'discount_amount' },
      { fieldname: 'base_grand_total', key: 'base_grand_total' },
      {
        fieldname: 'base_rounding_adjustment',
        key: 'base_rounding_adjustment',
      },
      { fieldname: 'base_in_words', key: 'base_in_words' },
      { fieldname: 'base_rounded_total', key: 'base_rounded_total' },
      { fieldname: 'grand_total', key: 'grand_total' },
      { fieldname: 'rounding_adjustment', key: 'rounding_adjustment' },
      { fieldname: 'rounded_total', key: 'rounded_total' },
      { fieldname: 'disable_rounded_total', key: 'disable_rounded_total' },
      { fieldname: 'in_words', key: 'in_words' },
      { fieldname: 'advance_paid', key: 'advance_paid' },
      { fieldname: 'terms', key: 'terms' },
      { fieldname: 'status', key: 'status' },
      { fieldname: 'party_account_currency', key: 'party_account_currency' },
      { fieldname: 'per_received', key: 'per_received' },
      { fieldname: 'per_billed', key: 'per_billed' },
      { fieldname: 'group_same_items', key: 'group_same_items' },
      { fieldname: 'language', key: 'language' },
      { fieldname: 'doctype', key: 'doctype' },
      { fieldname: 'items', key: 'items' },
      { fieldname: 'pricing_rules', key: 'pricing_rules' },
      { fieldname: 'supplied_items', key: 'supplied_items' },
      { fieldname: 'taxes', key: 'taxes' },
      { fieldname: 'payment_schedule', key: 'payment_schedule' },
      { fieldname: 'isSynced', key: 'isSynced' },
      { fieldname: 'inQueue', key: 'inQueue' },
      { fieldname: 'submitted', key: 'submitted' },
      { fieldname: 'created_on', key: 'created_on' },
      { fieldname: 'created_by', key: 'created_by' },
    ],
  };
}

export function purchaseInvoiceOnCancelWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Purchase Invoice',
    webhook_docevent: 'on_cancel',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [{ fieldname: 'name', key: 'name' }],
  };
}

export function purchaseReceiptOnCancelWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Purchase Receipt',
    webhook_docevent: 'on_cancel',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [{ fieldname: 'name', key: 'name' }],
  };
}

export function dataImportLegacyAfterInsertWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Data Import Legacy',
    webhook_docevent: 'after_insert',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      { fieldname: 'name', key: 'name' },
      { fieldname: 'import_status', key: 'import_status' },
      { fieldname: 'log_details', key: 'log_details' },
      { fieldname: 'reference_doctype', key: 'reference_doctype' },
    ],
  };
}

export function itemBundleAfterUpdateWebhookData(
  webhookURL: string,
  webhookApiKey: string,
) {
  return {
    webhook_doctype: 'Product Bundle',
    webhook_docevent: 'on_update',
    request_url: webhookURL,
    request_structure: 'Form URL-Encoded',
    doctype: 'Webhook',
    webhook_headers: [
      {
        key: 'Content-Type',
        value: 'application/json',
      },
      {
        key: 'x-frappe-api-key',
        value: webhookApiKey,
      },
    ],
    webhook_data: [
      { fieldname: 'name', key: 'name' },
      { fieldname: 'items', key: 'items' },
      { fieldname: 'description', key: 'description' },
      { fieldname: 'new_item_code', key: 'new_item_code' },
    ],
  };
}
