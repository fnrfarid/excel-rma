import { Injectable } from '@nestjs/common';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as uuidv4 from 'uuid/v4';
import { PURCHASE_INVOICE_ALREADY_EXIST } from '../../../constants/messages';
import {
  SUBMITTED_STATUS,
  CANCELED_STATUS,
} from '../../../constants/app-strings';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceWebhookDto } from '../../entity/sales-invoice/sales-invoice-webhook-dto';

@Injectable()
export class SalesInvoiceWebhookAggregateService {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  salesInvoiceCreated(salesInvoicePayload: SalesInvoiceWebhookDto) {
    return from(
      this.salesInvoiceService.findOne({
        name: salesInvoicePayload.name,
      }),
    ).pipe(
      switchMap(salesInvoice => {
        if (salesInvoice) {
          this.salesInvoiceService
            .updateOne(
              { name: salesInvoicePayload.name },
              {
                $set: {
                  outstanding_amount: salesInvoicePayload.outstanding_amount,
                  address_display: salesInvoicePayload.address_display,
                },
              },
            )
            .then(success => {})
            .catch(error => {});
          return of({ message: PURCHASE_INVOICE_ALREADY_EXIST });
        }
        const provider = this.mapPurchaseInvoice(salesInvoicePayload);

        this.salesInvoiceService
          .create(provider)
          .then(success => {})
          .catch(error => {});
        return of({});
      }),
    );
  }

  mapPurchaseInvoice(salesInvoicePayload: SalesInvoiceWebhookDto) {
    const salesInvoice = new SalesInvoice();
    Object.assign(salesInvoice, salesInvoicePayload);
    salesInvoice.uuid = uuidv4();
    salesInvoice.isSynced = true;
    salesInvoice.status = SUBMITTED_STATUS;
    salesInvoice.inQueue = false;
    salesInvoice.submitted = true;
    return salesInvoice;
  }

  salesInvoiceCanceled(canceledInvoice: { name: string }) {
    return this.salesInvoiceService.updateOne(
      { name: canceledInvoice.name },
      {
        $set: {
          isSynced: true,
          status: CANCELED_STATUS,
          inQueue: false,
          submitted: true,
        },
      },
    );
  }
}
