import { AddCustomerHandler } from './add-customer/add-customer-command.handler';
import { RemoveCustomerHandler } from './remove-customer/remove-customer-command.handler';
import { UpdateCustomerHandler } from './update-customer/update-customer-command.handler';

export const CustomerCommandManager = [
  AddCustomerHandler,
  RemoveCustomerHandler,
  UpdateCustomerHandler,
];
