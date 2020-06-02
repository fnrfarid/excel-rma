export const ADMINISTRATOR = 'administrator';
export const SYSTEM_MANAGER = 'System Manager';
export const TOKEN = 'token';
export const AUTHORIZATION = 'authorization';
export const SERVICE = 'rma-server';
export const PUBLIC = 'public';
export const APP_NAME = 'rma-server';
export const SWAGGER_ROUTE = 'api-docs';
export enum ConnectedServices {
  CommunicationServer = 'communication-server',
  InfrastructureConsole = 'infrastructure-console',
  IdentityProvider = 'identity-provider',
}
export const BEARER_HEADER_VALUE_PREFIX = 'Bearer ';
export const APPLICATION_JSON_CONTENT_TYPE = 'application/json';
export const CONTENT_TYPE_HEADER_KEY = 'Content-Type';
export const GLOBAL_API_PREFIX = 'api';
export const PASSWORD = 'password';
export const REFRESH_TOKEN = 'refresh_token';
export const OPENID = 'openid';
export const CONTENT_TYPE = 'content-type';
export const APP_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';
export const APP_JSON = 'application/json';
export const TEN_MINUTES_IN_SECONDS = 600;
export const REDIRECT_ENDPOINT = '/api/direct/callback';
export const PROFILE_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.openid_profile';
export const AUTH_ENDPOINT = '/api/method/frappe.integrations.oauth2.authorize';
export const REVOKE_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.revoke_token';
export const TOKEN_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.get_token';
export const TWENTY_MINUTES_IN_SECONDS = 1200; // 20 * 60; // 20 min * 60 sec;
export const SCOPE = 'all openid';
export const ACTIVE = 'Active';
export const REVOKED = 'Revoked';
export const CUSTOMER_ALREADY_EXISTS = 'Customer already exists';
export const ITEM_ALREADY_EXISTS = 'Item already exists';
export const SUPPLIER_ALREADY_EXISTS = 'Supplier already exists';
export const ACCEPT = 'Accept';
export const ITEM_METADATA_FILTER_FIELDS = [
  'creation',
  'modified',
  'modified_by',
  'parent',
  'parentfield',
  'parenttype',
];
export const NONE_PYTHON_STRING = 'None';
export const HUNDRED_NUMBERSTRING = '100';
export const DELIVERY_NOTE_LIST_FIELD = [
  'name',
  'title',
  'status',
  'posting_date',
  'total',
  'owner',
  'modified_by',
];
export const CREDIT_NOTE_LIST_FIELD = [
  'name',
  'owner',
  'modified_by',
  'title',
  'customer_name',
  'company',
  'posting_date',
  'due_date',
  'return_against',
  'contact_email',
  'total',
];
export const RETURN_VOUCHER_LIST_FIELD = [
  'name',
  'owner',
  'modified_by',
  'payment_type',
  'posting_date',
  'company',
  'mode_of_payment',
  'party_type',
  'party',
  'party_balance',
  'paid_amount',
];
export const INVALID_FILE =
  'Provided file is invalid please provide a JSON file with type claims : claim[]';
export const FILE_NOT_FOUND =
  'File is missing, please provide your claims file';
export const DRAFT_STATUS = 'Draft';
export const TO_DELIVER_STATUS = 'To Deliver';
export const REJECTED_STATUS = 'Rejected';
export const SUBMITTED_STATUS = 'Submitted';
export const COMPLETED_STATUS = 'Completed';
export const STOCK_ENTRY_STATUS = {
  in_transit: 'In transit',
  delivered: 'Delivered',
  canceled: 'Canceled',
};
export const CANCELED_STATUS = 'Canceled';
export const SALES_USER = 'Sales User';
export const SALES_MANAGER = 'Sales Manager';
export const SALES_INVOICE_STATUS_ENUM = [
  'Draft',
  'To Deliver',
  'Rejected',
  'Submitted',
];
export const PURCHASE_RECEIPT = 'purchase_receipt';
export const DELIVERY_NOTE = 'delivery_note';
export const DELIVERY_NOTE_DOCTYPE = 'Delivery Note';
export const PURCHASE_RECEIPT_SERIALS_BATCH_SIZE = 20;
export const STOCK_ENTRY_SERIALS_BATCH_SIZE = 20;
export const DELIVERY_NOTE_SERIAL_BATCH_SIZE = 1000;
export const SERIAL_NO_VALIDATION_BATCH_SIZE = 10000;
export const FRAPPE_INSERT_MANY_BATCH_COUNT = 2;
export const PURCHASE_RECEIPT_DOCTYPE_NAME = 'Purchase Receipt';
export const SERIAL_NO_DOCTYPE_NAME = 'Serial No';
export const MONGO_INSERT_MANY_BATCH_NUMBER = 10000;
export const VALIDATE_AUTH_STRING = 'validate_oauth';
export const TOKEN_HEADER_VALUE_PREFIX = 'token ';
export const STOCK_MATERIAL_TRANSFER = 'Material Transfer';
export const STOCK_ENTRY = 'Stock Entry';
export const ITEM_DOCTYPE = 'Item';
export const SALES_INVOICE_DOCTYPE = 'Sales Invoice';
export const FRAPPE_QUEUE_JOB = 'FRAPPE_QUEUE_JOB';
export const FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB =
  'FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB';
export const CREATE_DELIVERY_NOTE_JOB = 'CREATE_DELIVERY_NOTE_JOB';
export const STOCK_ENTRY_LIST_ITEM_SELECT_KEYS = [
  's_warehouse',
  't_warehouse',
  'item_code',
  'item_name',
  'qty',
  'transfer_qty',
  'transferWarehouse',
];
// following fields would be listed in API for job_queue/v1/list.
export const FRAPPE_JOB_SELECT_FIELDS = [
  'name',
  'failedAt',
  'failCount',
  'failReason',
  'data.status',
  'data.parent',
  'data.payload',
  'data.token.fullName',
  'data.sales_invoice_name',
  'data.type',
];
export const AGENDA_JOB_STATUS = {
  success: 'Successful',
  fail: 'Failed',
  in_queue: 'In Queue',
  reset: 'Reset',
  retrying: 'Retrying',
  exported: 'Exported',
};
export const AGENDA_MAX_RETRIES = 1;
export const AGENDA_DATA_IMPORT_MAX_RETRIES = 3;
export const FRAPPE_DATA_IMPORT_INSERT_ACTION = 'Insert new records';
export const SYNC_DELIVERY_NOTE_JOB = 'SYNC_DELIVERY_NOTE_JOB';
export enum WARRANTY_TYPE {
  WARRANTY = 'Warranty / Non Warranty',
  NON_SERAIL = 'Non Serial Warranty',
  THIRD_PARTY = 'Third Party Warranty',
}
