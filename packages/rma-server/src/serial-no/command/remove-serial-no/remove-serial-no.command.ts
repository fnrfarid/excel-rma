import { ICommand } from '@nestjs/cqrs';

export class RemoveSerialNoCommand implements ICommand {
  constructor(public readonly uuid: string) {}
}
