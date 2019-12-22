import { ICommand } from '@nestjs/cqrs';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';

export class UpdateSerialNoCommand implements ICommand {
  constructor(public readonly updatePayload: UpdateSerialNoDto) {}
}
