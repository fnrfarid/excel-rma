import { Customer } from './customer.interface';

export class SalesInvoice {
  uuid: string;
  status: string;
  series: string;
  customer: Customer;
  company: string;
}
