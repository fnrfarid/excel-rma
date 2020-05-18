import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { PurchaseReceiptDto } from '../entity/purchase-receipt-dto';
import { SerialNoService } from '../../serial-no/entity/serial-no/serial-no.service';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PURCHASE_INVOICE_NOT_FOUND } from '../../constants/messages';
import { PurchaseOrderService } from '../../purchase-order/entity/purchase-order/purchase-order.service';
import {
  HUNDRED_NUMBERSTRING,
  PURCHASE_RECEIPT_SERIALS_BATCH_SIZE,
} from '../../constants/app-strings';
import { FRAPPE_API_SERIAL_NO_ENDPOINT } from '../../constants/routes';
import { SettingsService } from '../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../system-settings/entities/server-settings/server-settings.entity';
import { TokenCache } from '../../auth/entities/token-cache/token-cache.entity';
import { FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT } from '../../constants/routes';

@Injectable()
export class PurchaseReceiptPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  validatePurchaseReceipt(purchaseReceiptPayload: PurchaseReceiptDto) {
    return this.validatePurchaseInvoice(purchaseReceiptPayload).pipe(
      switchMap(valid => {
        const serials = this.getSerials(purchaseReceiptPayload);
        const where = {
          serial_no: { $in: serials },
          $or:[
            {"queue_state.purchase_receipt" : {$exists : true}},
            {purchase_document_no: {$exists : true}},
          ]
        }
        return forkJoin({
          serials: from(this.serialNoService.find({where,take : 5})),
          count: this.serialNoService.count(where),
        });
      }),
      switchMap(({serials,count}) => {
        if (count) {
          return throwError(
            new BadRequestException(this.getSerialMessage(serials)),
          );
        }
        return of(true);
      }),
    );
  }

  getSerialMessage(serial) {
    const foundSerials = [];
    serial.forEach(element => {
      foundSerials.push(element.serial_no);
    });
    return `Found ${foundSerials.length} serials that are in a queue or already exist : ${foundSerials.splice(0, 5).join(', ')}..`;
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
        return from(
          this.purchaseOrderService.findOne({
            purchase_invoice_name: purchaseInvoice.name,
          }),
        );
      }),
      switchMap(response => {
        if (!response) {
          return throwError(
            new BadRequestException(
              'No purchase order was found against this invoice.',
            ),
          );
        }
        return of(true);
      }),
    );
  }

  validateFrappeSyncExistingSerials(
    serials: string[],
    settings: ServerSettings,
    token: TokenCache,
    purchase_order: string,
  ) {
    const params = {
      fields: JSON.stringify(['purchase_document_no', 'name', 'warehouse']),
      filters: JSON.stringify([['serial_no', 'in', serials]]),
      limit_page_length:
        HUNDRED_NUMBERSTRING + PURCHASE_RECEIPT_SERIALS_BATCH_SIZE * 2,
    };
    return this.http
      .get(settings.authServerURL + FRAPPE_API_SERIAL_NO_ENDPOINT, {
        params,
        headers: this.settingsService.getAuthorizationHeaders(token),
        timeout: 10000000,
      })
      .pipe(
        map(data => data.data.data),
        switchMap(
          (response: { purchase_document_no: string; name: string }[]) => {
            if (response.length !== serials.length) {
              return this.throwExistingSerials(response, serials);
            }
            return this.validateExistingFrappeSerials(
              settings,
              token,
              response,
              purchase_order,
            ).pipe(
              switchMap(success => {
                return of(response);
              }),
            );
          },
        ),
      );
  }

  validateExistingFrappeSerials(
    settings: ServerSettings,
    token,
    response: { purchase_document_no: string; name: string }[],
    purchase_order: string,
  ) {
    let purchase_receipt_names: any = new Set();
    response.forEach(res => {
      purchase_receipt_names.add(res.purchase_document_no);
    });
    purchase_receipt_names = Array.from(purchase_receipt_names);
    const params = {
      filters: JSON.stringify([
        ['name', 'in', purchase_receipt_names],
        ['purchase_order', '=', purchase_order],
      ]),
      limit_page_length:
        HUNDRED_NUMBERSTRING + PURCHASE_RECEIPT_SERIALS_BATCH_SIZE * 2,
    };
    return this.http
      .get(settings.authServerURL + FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT, {
        headers: this.settingsService.getAuthorizationHeaders(token),
        params,
      })
      .pipe(
        map(data => data.data.data),
        switchMap((frappe_receipts: { name: number }[]) => {
          if (frappe_receipts.length !== purchase_receipt_names.length) {
            return throwError(
              'Found serials assigned against different sales order, please reset the entry and try reassigning serials.',
            );
          }
          return of(true);
        }),
      );
  }

  throwExistingSerials(
    response: { purchase_document_no: string; name: string }[],
    serials: string[],
  ) {
    response.forEach(element => {
      for (let i = serials.length - 1; i >= 0; i--) {
        if (serials[i] !== element.name) {
          serials.splice(i, 1);
          break;
        }
      }
    });
    return throwError(
      `From Provided serials : ${serials.join(
        ', ',
      )}. are already assigned. Try to reset job and assign valid serials.`,
    );
  }
}
