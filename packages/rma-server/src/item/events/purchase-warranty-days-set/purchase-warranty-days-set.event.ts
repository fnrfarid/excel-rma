import { IEvent } from '@nestjs/cqrs';
import { SetWarrantyMonthsDto } from 'src/item/entity/item/set-warranty-months-dto';

export class WarrantyMonthsSetEvent implements IEvent {
  constructor(
    public readonly updatePayload: SetWarrantyMonthsDto,
    public readonly uuid: string,
  ) {}
}
