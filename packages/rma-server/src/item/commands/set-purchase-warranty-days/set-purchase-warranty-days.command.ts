import { ICommand } from '@nestjs/cqrs';

export class SetPurchaseWarrantyDaysCommand implements ICommand {
  constructor(public readonly uuid: string, public readonly days: number) {}
}
