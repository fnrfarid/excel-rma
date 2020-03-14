import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { CANCELED_STATUS } from '../../../constants/app-strings';
import { SalesInvoiceCanceledEvent } from './sales-invoice-canceled.event';

@EventsHandler(SalesInvoiceCanceledEvent)
export class SalesInvoiceCanceledHandler
  implements IEventHandler<SalesInvoiceCanceledEvent> {
  constructor(private readonly salesService: SalesInvoiceService) {}

  async handle(event: SalesInvoiceCanceledEvent) {
    const { salesInvoice } = event;
    await this.salesService.updateOne(
      { uuid: salesInvoice.uuid },
      {
        $set: {
          status: CANCELED_STATUS,
          inQueue: true,
          isSynced: false,
          outstanding_amount: 0,
        },
      },
    );
  }
}
