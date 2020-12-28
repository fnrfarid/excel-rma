export const CLOSE = 'Close';
export const SHORT_DURATION = 5000;
export const DURATION = 1000;
export const UPDATE_SUCCESSFUL = 'Update Successful';
export const UPDATE_ERROR = 'Update Error';
export const SYSTEM_MANAGER = 'System Manager';
export const USER_ROLE = 'user_roles';
export const TERRITORY = 'territory';
export const WAREHOUSES = 'warehouses';
export const DRAFT = 'Draft';
export const REJECTED = 'Rejected';
export const ACCEPT = 'Accept';
export const CONTENT_TYPE = 'Content-Type';
export const APPLICATION_JSON = 'application/json';
export const PURCHASE_RECEIPT = 'purchase_receipt';
export const DELIVERY_NOTE = 'delivery_note';
export const JSON_BODY_MAX_SIZE = 8000;
export const MATERIAL_TRANSFER = 'Material Transfer';
export const MATERIAL_ISSUE = 'Material Issue';
export const MATERIAL_RECEIPT = 'Material Receipt';
export const PURCHASE_USER = 'Purchase User';
export const EXCEL_SALES_MANAGER = 'Excel Sales Manager';
export const EXCEL_SALES_USER = 'Excel Sales User';
export const SERVICE_INVOICE_STATUS = {
  SUBMITTED: 'Submitted',
  PAID: 'Paid',
  UNPAID: 'Unpaid',
};
export const SERIAL_DOWNLOAD_HEADERS = [
  'serial_no',
  'item_code',
  'item_name',
  'warehouse',
];
export const WARRANTY_CLAIMS_DOWNLOAD_HEADERS = [
  'claim_no',
  'claim_type',
  'received_date',
  'customer_third_party',
  'customer_name',
  'third_party_name',
  'item_code',
  'claimed_serial',
  'claim_status',
  'receiving_branch',
  'delivery_branch',
  'received_by',
  'delivered_by',
];
export const WARRANTY_CLAIMS_CSV_FILE = 'warranty-claim-list.csv';
export const CSV_FILE_TYPE = ' serials.csv';
export const WARRANTY_TYPE = {
  WARRANTY: 'Warranty',
  NON_WARRANTY: 'Non Warranty',
  NON_SERAIL: 'Non Serial Warranty',
  THIRD_PARTY: 'Third Party Warranty',
};

export const CURRENT_STATUS_VERDICT = {
  RECEIVED_FROM_CUSTOMER: 'Received from Customer',
  RECEIVED_FROM_BRANCH: 'Received from Branch',
  WORK_IN_PROGRESS: 'Work in Progress',
  TRANSFERRED: 'Transferred',
  SOLVED: 'Solved - Repairing done',
  TO_REPLACE: 'Unsolved - To Replace',
  UNSOLVED: 'Unsolved - Return to Owner',
  DELIVER_TO_CUSTOMER: 'Deliver to Customer',
};

export const DELIVERY_STATUS = {
  REPAIRED: 'Repaired',
  REPLACED: 'Replaced',
  UPGRADED: 'Upgraded',
  REJECTED: 'Rejected',
};

export const ITEM_COLUMN = {
  SERIAL_NO: 'serial_no',
  ITEM: 'item',
  ITEM_NAME: 'item_name',
  ITEM_CODE: 'item_code',
  QUANTITY: 'quantity',
  RATE: 'rate',
  WAREHOUSE: 'warehouse',
  STOCK_ENTRY_ITEM_TYPE: 'stock_entry_type',
};

export const STOCK_ENTRY_STATUS = {
  REPLACE: 'Replace',
  UPGRADE: 'Upgrade',
};
export const STOCK_ENTRY_ITEM_TYPE = {
  RETURNED: 'Returned',
  DELIVERED: 'Delivered',
};
