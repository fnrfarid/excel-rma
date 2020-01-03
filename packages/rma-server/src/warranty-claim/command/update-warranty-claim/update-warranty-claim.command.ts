import { ICommand } from '@nestjs/cqrs';
import { UpdateWarrantyClaimDto } from '../../entity/warranty-claim/update-warranty-claim-dto';

export class UpdateWarrantyClaimCommand implements ICommand {
  constructor(public readonly updatePayload: UpdateWarrantyClaimDto) {}
}
