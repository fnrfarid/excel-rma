import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdateWarrantyClaimCommand } from './update-warranty-claim.command';
import { WarrantyClaimAggregateService } from '../../aggregates/warranty-claim-aggregate/warranty-claim-aggregate.service';

@CommandHandler(UpdateWarrantyClaimCommand)
export class UpdateWarrantyClaimCommandHandler
  implements ICommandHandler<UpdateWarrantyClaimCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: WarrantyClaimAggregateService,
  ) {}

  async execute(command: UpdateWarrantyClaimCommand) {
    const { updatePayload } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await this.manager.update(updatePayload);
    aggregate.commit();
  }
}
