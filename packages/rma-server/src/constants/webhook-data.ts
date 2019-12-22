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
) {
  return {
    webhook_doctype: 'OAuth Bearer Token',
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
    ],
  };
}
