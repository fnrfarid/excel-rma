import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { CANCELED_STATUS } from '../../../constants/app-strings';
import { SalesInvoiceCanceledEvent } from './sales-invoice-canceled.event';

@EventsHandler(SalesInvoiceCanceledEvent)
export class SalesInvoiceCanceledHandler
  implements IEventHandler<SalesInvoiceCanceledEvent> {
  constructor(private readonly object: SalesInvoiceService) {}

  async handle(event: SalesInvoiceCanceledEvent) {
    const { salesInvoice: updatePayload } = event;
    await this.object.updateOne(
      { uuid: updatePayload.uuid },
      { $set: { status: CANCELED_STATUS } },
    );
  }
}
