import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { CustomerAggregateService } from '../../aggregates/customer-aggregate/customer-aggregate.service';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler
  implements ICommandHandler<UpdateCustomerCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: CustomerAggregateService,
  ) {}

  async execute(command: UpdateCustomerCommand) {
    const { updatePayload } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await this.manager.updateCustomer(updatePayload);
    aggregate.commit();
  }
}
