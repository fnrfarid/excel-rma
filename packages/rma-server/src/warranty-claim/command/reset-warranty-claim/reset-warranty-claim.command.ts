import { ICommand } from '@nestjs/cqrs';

export class ResetWarrantyClaimCommand implements ICommand {
  constructor(public readonly uuid: string) {}
}
