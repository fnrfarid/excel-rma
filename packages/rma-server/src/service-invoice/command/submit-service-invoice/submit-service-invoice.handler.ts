import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { SubmitServiceInvoiceCommand } from './submit-service-invoice.command';
import { ServiceInvoiceAggregateService } from '../../aggregates/service-invoice-aggregate/service-invoice-aggregate.service';

@CommandHandler(SubmitServiceInvoiceCommand)
export class SubmitServiceInvoiceCommandHandler
  implements ICommandHandler<SubmitServiceInvoiceCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: ServiceInvoiceAggregateService,
  ) {}

  async execute(command: SubmitServiceInvoiceCommand) {
    const { uuid, req } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await this.manager.syncInvoice(uuid, req).toPromise();
    aggregate.commit();
  }
}
