import { PermissionStateInterface } from '../api/permission/permission.service';

export const PermissionRoles = {
  sales_invoice: {
    read: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    create: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'General Admin',
    ],
    update: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'General Admin',
    ],
    submit: [
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'General Admin',
    ],
    delete: [],
  },
  sales_return: {
    read: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    create: ['Branch Sales Return User', 'General Admin'],
    update: ['Branch Sales Return User', 'General Admin'],
    delete: [],
  },

  purchase_invoice: {
    read: ['Branch Purchase User', 'Branch Purchase Manager', 'General Admin'],
    submit: ['Branch Purchase Manager', 'General Admin'],
    delete: [],
  },

  delivery_note: {
    read: [
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    create: [
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    update: [
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    submit: [
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    delete: [],
  },

  stock_entry: {
    read: [
      'Branch Sales Manager',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    create: [
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    submit: [
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
    delete: [],
  },

  customer_profile: {
    read: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock Manager',
      'General Admin',
    ],
  },
  rd_products: {
    read: [],
    create: [],
  },
  stock_history: {
    read: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
  },

  credit_limit: {
    create: ['Credit Limit Manager', 'General Admin'],
    read: ['Credit Limit Manager', 'General Admin'],
    update: ['Credit Limit Manager', 'General Admin'],
    delete: ['Credit Limit Manager', 'General Admin'],
  },

  item_price: {
    create: ['Item Price Manager', 'General Admin'],
    read: ['Item Price Manager', 'General Admin'],
    update: ['Item Price Manager', 'General Admin'],
    delete: ['Item Price Manager', 'General Admin'],
  },

  jobs: {
    read: ['General Admin'],
    update: ['General Admin'],
  },

  settings: {
    read: ['General Admin'],
    update: ['General Admin'],
  },

  credit_note: {
    read: [
      'Branch Sales Creator',
      'Branch Sales User',
      'Branch Sales Manager',
      'Branch Sales Return User',
      'Branch Stock User',
      'Branch Stock Supervisor',
      'Branch Stock Manager',
      'General Admin',
    ],
  },

  purchase_receipt: {
    read: ['Branch Purchase User', 'Branch Purchase Manager', 'General Admin'],
    create: ['Branch Purchase Manager', 'General Admin'],
    update: ['Branch Purchase Manager', 'General Admin'],
    submit: ['Branch Purchase Manager', 'General Admin'],
    delete: [],
  },

  warranty_claim: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  service_invoice: {
    create: [],
    read: [],
  },

  status_history: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  campaign_return: {
    create: [],
    read: [],
  },
};

export const PERMISSION_STATE: PermissionStateInterface = {
  sales_invoice: {
    create: false,
    read: false,
    update: false,
    delete: false,
    submit: false,
    active: false,
  },

  delivery_note: {
    create: false,
    read: false,
    update: false,
    delete: false,
    active: false,
  },

  item_price: {
    create: false,
    read: false,
    update: false,
    active: false,
  },

  sales_return: {
    create: false,
    read: false,
    update: false,
    delete: false,
    active: false,
  },

  credit_limit: {
    create: false,
    read: false,
    update: false,
    delete: false,
    active: false,
  },

  rd_products: {
    read: false,
    create: false,
    active: false,
  },

  credit_note: {
    read: false,
    active: false,
  },

  purchase_invoice: {
    read: false,
    active: false,
  },

  purchase_receipt: {
    create: false,
    read: false,
    active: false,
  },

  warranty_claim: {
    create: false,
    read: false,
    update: false,
    delete: false,
    active: false,
  },

  service_invoice: {
    create: false,
    read: false,
    active: false,
  },

  status_history: {
    create: false,
    read: false,
    update: false,
    delete: false,
    active: false,
  },

  stock_history: {
    create: false,
    read: false,
    active: false,
  },

  stock_entry: {
    create: false,
    read: false,
    active: false,
  },

  jobs: {
    read: false,
    update: false,
    active: false,
  },

  customer_profile: {
    read: false,
    active: false,
  },

  settings: {
    read: false,
    update: false,
    active: false,
  },
  campaign_return: {
    create: false,
    read: false,
  },
};
