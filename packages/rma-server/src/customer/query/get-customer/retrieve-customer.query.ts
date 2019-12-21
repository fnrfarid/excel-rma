import { IQuery } from '@nestjs/cqrs';

export class RetrieveCustomerQuery implements IQuery {
  constructor(public readonly uuid: string, public readonly req: any) {}
}
