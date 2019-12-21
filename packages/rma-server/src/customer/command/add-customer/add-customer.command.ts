import { ICommand } from '@nestjs/cqrs';
import { CustomerDto } from '../../entity/customer/customer-dto';

export class AddCustomerCommand implements ICommand {
  constructor(
    public CustomerPayload: CustomerDto,
    public readonly clientHttpRequest: any,
  ) {}
}
