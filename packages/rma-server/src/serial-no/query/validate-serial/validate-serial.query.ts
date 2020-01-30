import { IQuery } from '@nestjs/cqrs';

export class ValidateSerialsQuery implements IQuery {
  constructor(
    public readonly serials: string[],
    public readonly clientHttpReq: any,
  ) {}
}
