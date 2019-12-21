import { ICommand } from '@nestjs/cqrs';
import { Customer } from '../../entity/customer/customer.entity';

export class UpdateCustomerCommand implements ICommand {
  constructor(public readonly updatePayload: Customer) {}
}
