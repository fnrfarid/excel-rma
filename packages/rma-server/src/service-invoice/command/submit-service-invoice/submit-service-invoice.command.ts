import { ICommand } from '@nestjs/cqrs';

export class SubmitServiceInvoiceCommand implements ICommand {
  constructor(public readonly uuid: string, public readonly req: any) {}
}
