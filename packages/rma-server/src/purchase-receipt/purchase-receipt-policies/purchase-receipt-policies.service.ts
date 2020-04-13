import { Injectable, BadRequestException } from '@nestjs/common';
import { PurchaseReceiptDto } from '../entity/purchase-receipt-dto';
import { SerialNoService } from '../../serial-no/entity/serial-no/serial-no.service';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PURCHASE_INVOICE_NOT_FOUND } from '../../constants/messages';

@Injectable()
export class PurchaseReceiptPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  validatePurchaseReceipt(purchaseReceiptPayload: PurchaseReceiptDto) {
    return this.validatePurchaseInvoice(purchaseReceiptPayload).pipe(
      switchMap(valid => {
        const serials = this.getSerials(purchaseReceiptPayload);
        return from(
          this.serialNoService.find({
            serial_no: { $in: serials },
            warehouse: { $exists: true },
          }),
        ).pipe(
          switchMap(foundSerials => {
            if (foundSerials && foundSerials.length) {
              return throwError(
                new BadRequestException(this.getSerialMessage(foundSerials)),
              );
            }
            return of(true);
          }),
        );
      }),
    );
  }

  getSerialMessage(serial) {
    const foundSerials = [];
    serial.forEach(element => {
      foundSerials.push(element.serial_no);
    });
    return `From Provided serials ${
      foundSerials.length
    } already exist, found : ${foundSerials.splice(0, 5).join(', ')}..`;
  }

  getSerials(purchaseReceiptPayload: PurchaseReceiptDto) {
    const serials = [];
    for (const item of purchaseReceiptPayload.items) {
      for (const serial_no of item.serial_no) {
        serials.push(serial_no);
      }
    }
    return serials;
  }

  validatePurchaseInvoice(purchaseReceiptPayload: PurchaseReceiptDto) {
    return from(
      this.purchaseInvoiceService.findOne({
        name: purchaseReceiptPayload.purchase_invoice_name,
      }),
    ).pipe(
      switchMap(purchaseInvoice => {
        if (!purchaseInvoice) {
          return throwError(
            new BadRequestException(PURCHASE_INVOICE_NOT_FOUND),
          );
        }
        return of(true);
      }),
    );
  }
}
