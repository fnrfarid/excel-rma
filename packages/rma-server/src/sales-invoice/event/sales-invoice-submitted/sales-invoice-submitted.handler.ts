import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SalesInvoiceSubmittedEvent } from './sales-invoice-submitted.event';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';

@EventsHandler(SalesInvoiceSubmittedEvent)
export class SalesInvoiceSubmittedHandler
  implements IEventHandler<SalesInvoiceSubmittedEvent> {
  constructor(private readonly object: SalesInvoiceService) {}

  async handle(event: SalesInvoiceSubmittedEvent) {
    const { salesInvoice: updatePayload } = event;
    await this.object.updateOne(
      { uuid: updatePayload.uuid },
      { $set: { inQueue: true } },
    );
  }
}
