import { ICommand } from '@nestjs/cqrs';
import { SerialNoDto } from '../../entity/serial-no/serial-no-dto';

export class AddSerialNoCommand implements ICommand {
  constructor(
    public serialNoPayload: SerialNoDto,
    public readonly clientHttpRequest: any,
  ) {}
}
