import { ICommand } from '@nestjs/cqrs';
import { WarrantyClaimDto } from 'src/warranty-claim/entity/warranty-claim/warranty-claim-dto';

export class UpdateWarrantyClaimCommand implements ICommand {
  constructor(
    public readonly updatePayload: WarrantyClaimDto,
    public readonly req: any,
  ) {}
}
