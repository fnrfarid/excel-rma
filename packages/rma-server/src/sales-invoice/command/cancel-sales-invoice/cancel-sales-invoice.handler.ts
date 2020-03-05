import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { SalesInvoiceAggregateService } from '../../aggregates/sales-invoice-aggregate/sales-invoice-aggregate.service';
import { CancelSalesInvoiceCommand } from './cancel-sales-invoice.command';

@CommandHandler(CancelSalesInvoiceCommand)
export class CancelSalesInvoiceHandler
  implements ICommandHandler<CancelSalesInvoiceCommand> {
  constructor(
    private publisher: EventPublisher,
    private manager: SalesInvoiceAggregateService,
  ) {}

  async execute(command: CancelSalesInvoiceCommand) {
    const { uuid, clientHttpReq } = command;
    const aggregate = this.publisher.mergeObjectContext(this.manager);
    await aggregate.cancelSalesInvoice(uuid, clientHttpReq).toPromise();
    aggregate.commit();
  }
}
