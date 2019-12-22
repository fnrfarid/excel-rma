import { IQuery } from '@nestjs/cqrs';

export class RetrieveSerialNoQuery implements IQuery {
  constructor(public readonly uuid: string, public readonly req: any) {}
}
