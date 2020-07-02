import { PermissionStateInterface } from '../api/permission/permission.service';

export const PermissionRoles = {
  sales_invoice: {
    create: [],
    read: [],
    update: [],
    delete: [],
    submit: [],
  },

  delivery_note: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  sales_return: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  rd_products: {
    read: [],
    create: [],
  },

  credit_note: {
    read: [],
  },

  purchase_invoice: {
    read: [],
  },

  purchase_receipt: {
    create: [],
    read: [],
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

  stock_history: {
    create: [],
    read: [],
  },

  stock_entry: {
    create: [],
    read: [],
  },

  jobs: {
    read: [],
    update: [],
  },

  customer_profile: {
    read: [],
  },

  settings: {
    read: [],
    update: [],
  },
};

export const PERMISSION_STATE: PermissionStateInterface = {
  sales_invoice: {
    create: false,
    read: false,
    active: false,
    update: false,
    delete: false,
    submit: false,
  },

  delivery_note: {
    create: false,
    read: false,
    active: false,
    update: false,
    delete: false,
  },

  sales_return: {
    create: false,
    read: false,
    active: false,
    update: false,
    delete: false,
  },

  rd_products: {
    read: false,
    active: false,
    create: false,
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
    active: false,
    update: false,
    delete: false,
  },

  service_invoice: {
    create: false,
    read: false,
    active: false,
  },

  status_history: {
    create: false,
    read: false,
    active: false,
    update: false,
    delete: false,
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
    active: false,
    update: false,
  },

  customer_profile: {
    read: false,
    active: false,
  },

  settings: {
    read: false,
    active: false,
    update: false,
  },
};
