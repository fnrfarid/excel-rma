import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { PurchaseReceiptDto } from '../../entity/purchase-receipt-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT } from '../../../constants/routes';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APP_WWW_FORM_URLENCODED,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
  COMPLETED_STATUS,
} from '../../../constants/app-strings';
import { PurchaseReceiptResponseInterface } from '../../entity/purchase-receipt-response-interface';
import { PurchaseInvoicePurchaseReceiptItem } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';

@Injectable()
export class PurchaseReceiptAggregateService extends AggregateRoot {
  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly purchaseReceiptPolicyService: PurchaseReceiptPoliciesService,
  ) {
    super();
  }

  addPurchaseInvoice(
    purchaseInvoicePayload: PurchaseReceiptDto,
    clientHttpRequest,
  ) {
    return this.purchaseReceiptPolicyService
      .validatePurchaseReceipt(purchaseInvoicePayload)
      .pipe(
        switchMap(isValid => {
          return this.settingsService.find().pipe(
            switchMap(settings => {
              if (!settings.authServerURL) {
                return throwError(new NotImplementedException());
              }
              const purchase_invoice_name =
                purchaseInvoicePayload.purchase_invoice_name;
              const body = this.mapPurchaseInvoiceReceipt(
                purchaseInvoicePayload,
              );
              return this.http
                .post(
                  settings.authServerURL + FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT,
                  body,
                  {
                    headers: {
                      [AUTHORIZATION]:
                        BEARER_HEADER_VALUE_PREFIX +
                        clientHttpRequest.token.accessToken,
                      [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
                      [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
                    },
                  },
                )
                .pipe(
                  map(data => data.data.data),
                  switchMap(
                    (purchaseReceipt: PurchaseReceiptResponseInterface) => {
                      this.linkPurchaseInvoice(
                        purchaseReceipt,
                        purchase_invoice_name,
                        clientHttpRequest,
                      );
                      return of({});
                    },
                  ),
                );
            }),
            catchError(err => {
              return throwError(
                new BadRequestException(
                  err.response ? err.response.data.exc : err,
                ),
              );
            }),
          );
        }),
      );
  }

  linkPurchaseInvoice(
    purchaseReceipt: PurchaseReceiptResponseInterface,
    purchase_invoice_name: string,
    clientHttpRequest,
  ) {
    const purchaseReceiptItems = this.mapPurchaseInvoiceMetaData(
      purchaseReceipt,
      clientHttpRequest,
    );
    this.purchaseInvoiceService
      .updateOne(
        { name: purchase_invoice_name },
        {
          $push: { purchase_receipt_items: { $each: purchaseReceiptItems } },
          $set: { status: COMPLETED_STATUS },
        },
      )
      .then(success => {})
      .catch(error => {});
    return;
  }

  mapPurchaseInvoiceMetaData(
    purchaseReceipt: PurchaseReceiptResponseInterface,
    clientHttpRequest,
  ) {
    const purchaseReceiptItems = [];
    purchaseReceipt.items.forEach(item => {
      const purchaseInvoiceReceiptItem = new PurchaseInvoicePurchaseReceiptItem();
      purchaseInvoiceReceiptItem.purchase_receipt_name = purchaseReceipt.name;
      purchaseInvoiceReceiptItem.amount = item.amount;
      purchaseInvoiceReceiptItem.cost_center = item.cost_center;
      purchaseInvoiceReceiptItem.expense_account = item.expense_account;
      purchaseInvoiceReceiptItem.item_code = item.item_code;
      purchaseInvoiceReceiptItem.item_name = item.item_name;
      purchaseInvoiceReceiptItem.name = item.name;
      purchaseInvoiceReceiptItem.qty = item.qty;
      purchaseInvoiceReceiptItem.rate = item.rate;
      purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
      purchaseInvoiceReceiptItem.warehouse = item.warehouse;
      purchaseInvoiceReceiptItem.deliveredBy = clientHttpRequest.token.fullName;
      purchaseInvoiceReceiptItem.deliveredByEmail =
        clientHttpRequest.token.email;
      purchaseReceiptItems.push(purchaseInvoiceReceiptItem);
    });
    return purchaseReceiptItems;
  }

  mapPurchaseInvoiceReceipt(purchaseInvoicePayload: PurchaseReceiptDto) {
    delete purchaseInvoicePayload.purchase_invoice_name;
    purchaseInvoicePayload.docstatus = 1;
    purchaseInvoicePayload.is_return = 0;
    purchaseInvoicePayload.items.filter(item => {
      item.serial_no = item.serial_no.join('\n');
      return item;
    });
    return purchaseInvoicePayload;
  }
  async retrievePurchaseInvoice(uuid: string, req) {
    return;
  }

  async getPurchaseInvoiceList(offset, limit, sort, search, clientHttpRequest) {
    return;
  }
}
