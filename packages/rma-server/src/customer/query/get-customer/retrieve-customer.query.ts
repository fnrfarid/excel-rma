import { IQuery } from '@nestjs/cqrs';

export class RetrieveCustomerQuery implements IQuery {
  constructor(
    public readonly customer_name: string,
    public readonly req: any,
  ) {}
}
