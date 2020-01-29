import { Injectable, BadRequestException } from '@nestjs/common';
import { PurchaseInvoiceWebhookDto } from '../../entity/purchase-invoice/purchase-invoice-webhook-dto';
import { PurchaseInvoiceService } from '../../entity/purchase-invoice/purchase-invoice.service';
import { PurchaseInvoice } from '../../entity/purchase-invoice/purchase-invoice.entity';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as uuidv4 from 'uuid/v4';
import { PURCHASE_INVOICE_ALREADY_EXIST } from '../../../constants/messages';
import { SUBMITTED_STATUS } from '../../../constants/app-strings';

@Injectable()
export class PurchaseInvoiceWebhookAggregateService {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  purchaseInvoiceCreated(purchaseInvoicePayload: PurchaseInvoiceWebhookDto) {
    return from(
      this.purchaseInvoiceService.findOne({
        name: purchaseInvoicePayload.name,
      }),
    ).pipe(
      switchMap(purchaseInvoice => {
        if (purchaseInvoice) {
          return throwError(
            new BadRequestException(PURCHASE_INVOICE_ALREADY_EXIST),
          );
        }
        const provider = this.mapPurchaseInvoice(purchaseInvoicePayload);

        this.purchaseInvoiceService
          .create(provider)
          .then(success => {})
          .catch(error => {});
        return of({});
      }),
    );
  }

  mapPurchaseInvoice(purchaseInvoicePayload: PurchaseInvoiceWebhookDto) {
    const purchaseInvoice = new PurchaseInvoice();
    Object.assign(purchaseInvoice, purchaseInvoicePayload);
    purchaseInvoice.uuid = uuidv4();
    purchaseInvoice.isSynced = true;
    purchaseInvoice.status = SUBMITTED_STATUS;
    purchaseInvoice.inQueue = false;
    purchaseInvoice.submitted = true;
    return purchaseInvoice;
  }
}
