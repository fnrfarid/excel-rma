import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CancelSalesInvoiceCommand } from './cancel-sales-invoice.command';
import { CancelSalesInvoiceAggregateService } from '../../aggregates/cancel-sales-invoice-aggregate/cancel-sales-invoice-aggregate.service';

@CommandHandler(CancelSalesInvoiceCommand)
export class CancelSalesInvoiceHandler
  implements ICommandHandler<CancelSalesInvoiceCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: CancelSalesInvoiceAggregateService,
  ) {}

  async execute(command: CancelSalesInvoiceCommand) {
    const { uuid, clientHttpReq } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await aggregate.cancelSalesInvoice(uuid, clientHttpReq).toPromise();
    aggregate.commit();
  }
}
