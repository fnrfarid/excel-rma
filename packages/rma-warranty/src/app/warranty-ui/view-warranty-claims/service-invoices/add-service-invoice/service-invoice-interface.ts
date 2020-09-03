import { Item } from '../../../../common/interfaces/warranty.interface';

export class ServiceInvoiceDetails {
  customer: string;
  customer_contact?: string;
  total_qty?: number;
  total?: number;
  status?: string;
  contact_email?: string;
  due_date?: string;
  remarks?: string;
  delivery_warehouse?: string;
  items: Item[];
  invoice_no?: string;
  date: string;
  customer_third_party?: string;
  invoice_amount?: number;
  claim_no?: string;
  branch?: string;
  created_by?: string;
  submitted_by?: string;
  posting_date: string;
  customer_name?: string;
  customer_address: string;
  third_party_name?: string;
  third_party_address?: string;
  third_party_contact?: string;
  docstatus: number;
  warrantyClaimUuid: string;
  debit_to?: string;
  cash_bank_account?: string;
  is_pos?: number;
  pos_profile?: string;
  payments?: Payments[];
}

export class Payments {
  account: string;
  mode_of_payment: string;
  amount: number;
}