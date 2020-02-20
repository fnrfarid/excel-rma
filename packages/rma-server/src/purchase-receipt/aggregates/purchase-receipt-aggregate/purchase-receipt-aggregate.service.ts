import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import {
  PurchaseReceiptDto,
  PurchaseReceiptItemDto,
} from '../../entity/purchase-receipt-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import {
  switchMap,
  map,
  catchError,
  bufferCount,
  mergeMap,
  retry,
  delay,
} from 'rxjs/operators';
import { throwError, of, Observable, from } from 'rxjs';
import {
  FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT,
  FRAPPE_API_GET_DOCTYPE_COUNT,
  FRAPPE_API_INSERT_MANY,
} from '../../../constants/routes';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APP_WWW_FORM_URLENCODED,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
  COMPLETED_STATUS,
  PURCHASE_RECEIPT_BATCH_SIZE,
  SERIAL_NO_VALIDATION_BATCH_SIZE,
  FRAPPE_INSERT_MANY_BATCH_COUNT,
} from '../../../constants/app-strings';
import { PurchaseReceiptResponseInterface } from '../../entity/purchase-receipt-response-interface';
import { PurchaseInvoicePurchaseReceiptItem } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { PurchaseReceiptService } from '../../../purchase-receipt/entity/purchase-receipt.service';

@Injectable()
export class PurchaseReceiptAggregateService extends AggregateRoot {
  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly purchaseReceiptPolicyService: PurchaseReceiptPoliciesService,
    private readonly errorLogService: ErrorLogService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
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
        switchMap(valid => {
          return this.settingsService.find().pipe(
            switchMap(settings => {
              if (!settings.authServerURL) {
                return throwError(new NotImplementedException());
              }
              const { body, item_count } = this.mapPurchaseInvoiceReceipt(
                purchaseInvoicePayload,
              );

              return item_count < 1000
                ? this.validateFrappeSerials(
                    settings,
                    body,
                    clientHttpRequest,
                  ).pipe(
                    switchMap(isValid => {
                      return isValid === true
                        ? this.createFrappePurchaseReceipt(
                            settings,
                            body,
                            clientHttpRequest,
                            purchaseInvoicePayload.purchase_invoice_name,
                          )
                        : throwError(
                            new BadRequestException(
                              `Provided batch have ${isValid} serials that already exists`,
                            ),
                          );
                    }),
                  )
                : this.batchPurchaseReceipt(
                    settings,
                    body,
                    clientHttpRequest,
                    purchaseInvoicePayload.purchase_invoice_name,
                  );
            }),
            catchError(err => {
              if (err.response && err.response.data) {
                this.errorLogService.createErrorLog(
                  err,
                  'Purchase Receipt',
                  'Purchase Receipt',
                  clientHttpRequest,
                );
                return throwError(
                  new BadRequestException(err.response.data.exc),
                );
              }
              return throwError(err);
            }),
          );
        }),
      );
  }

  validateFrappeSerials(
    settings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    serialsNo?: string[],
  ): Observable<boolean | number> {
    const serials = serialsNo ? serialsNo : this.getMappedSerials(body);
    const frappeBody = {
      doctype: 'Serial No',
      filters: { serial_no: ['in', serials] },
    };
    return this.http
      .post(settings.authServerURL + FRAPPE_API_GET_DOCTYPE_COUNT, frappeBody, {
        headers: this.settingsService.getAuthorizationHeaders(
          clientHttpRequest.token,
        ),
      })
      .pipe(
        map(data => data.data),
        switchMap((response: { message: number }) => {
          if (response.message === 0) {
            return of(true);
          }
          return of(response.message);
        }),
      );
  }

  getMappedSerials(purchaseReceipt: PurchaseReceiptDto) {
    const serials = [];
    purchaseReceipt.items.forEach(element => {
      serials.push(...element.serial_no.split('\n'));
    });
    return serials;
  }

  createFrappePurchaseReceipt(
    settings: ServerSettings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name: string,
  ) {
    return this.http
      .post(
        settings.authServerURL + FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT,
        body,
        {
          headers: {
            [AUTHORIZATION]:
              BEARER_HEADER_VALUE_PREFIX + clientHttpRequest.token.accessToken,
            [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
            [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
          },
        },
      )
      .pipe(
        map(data => data.data.data),
        switchMap((purchaseReceipt: PurchaseReceiptResponseInterface) => {
          this.linkPurchaseInvoice(
            purchaseReceipt,
            purchase_invoice_name,
            clientHttpRequest,
          );
          return of({});
        }),
      );
  }

  batchPurchaseReceipt(
    settings: ServerSettings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name: string,
  ) {
    return this.batchValidateSerials(settings, body, clientHttpRequest).pipe(
      switchMap(isValid => {
        this.createBatchedPurchaseReceipts(
          settings,
          body,
          clientHttpRequest,
          purchase_invoice_name,
        );
        return of({});
      }),
    );
  }

  createBatchedPurchaseReceipts(
    settings: ServerSettings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name: string,
  ) {
    const purchaseReceipts = this.getMapPurchaseReceipts(body);
    from(purchaseReceipts)
      .pipe(
        map(receipts => {
          receipts.serial_no = receipts.serial_no.join('\n');
          const data: any = new PurchaseReceiptDto();
          Object.assign(data, body);
          data.items = [receipts];
          data.doctype = 'Purchase Receipt';
          return data;
        }),
        bufferCount(FRAPPE_INSERT_MANY_BATCH_COUNT),
        mergeMap(receipt => {
          return this.http.post<any>(
            settings.authServerURL + FRAPPE_API_INSERT_MANY,
            { docs: JSON.stringify(receipt) },
            {
              headers: this.settingsService.getAuthorizationHeaders(
                clientHttpRequest.token,
              ),
            },
          );
        }),
        delay(300),
        retry(8),
      )
      .subscribe({
        next: (success: { data: { message: string[] }; config: any }) => {
          this.purchaseInvoiceService
            .updateOne(
              { name: purchase_invoice_name },
              {
                $push: {
                  purchase_receipt_names: { $each: success.data.message },
                },
                $set: { status: COMPLETED_STATUS },
              },
            )
            .then(done => {})
            .catch(error => {});
          const purchaseReceiptMany = [];
          const data = JSON.parse(JSON.parse(success.config.data).docs);
          data.forEach(item => {
            purchaseReceiptMany.push(
              ...this.mapPurchaseInvoiceMetaData(
                item,
                clientHttpRequest,
                purchase_invoice_name,
              ),
            );
          });
          this.purchaseReceiptService
            .insertMany(purchaseReceiptMany)
            .then(done => {})
            .catch(error => {});
        },
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            'Purchase Receipt',
            'purchaseInvoice',
            clientHttpRequest,
          );
        },
      });
  }

  getMapPurchaseReceipts(body: PurchaseReceiptDto) {
    const purchaseReceipts = [];
    body.items.forEach(item => {
      if (item.qty > PURCHASE_RECEIPT_BATCH_SIZE) {
        const quotient = Math.floor(item.qty / PURCHASE_RECEIPT_BATCH_SIZE);
        const remainder = item.qty % PURCHASE_RECEIPT_BATCH_SIZE;
        item.serial_no = item.serial_no.split('\n');
        const offsetItem: PurchaseReceiptItemDto = item;
        if (remainder) {
          offsetItem.qty = remainder;
          offsetItem.amount = offsetItem.qty * offsetItem.rate;
          offsetItem.serial_no = offsetItem.serial_no.splice(0, remainder);
          body.items = [offsetItem];
          purchaseReceipts.push(body);
        }
        offsetItem.qty = 200;
        offsetItem.amount = offsetItem.qty * offsetItem.rate;
        offsetItem.serial_no = item.serial_no.splice(
          remainder,
          item.serial_no.length,
        );
        purchaseReceipts.push(
          ...this.generateBatchedReceipt(offsetItem, quotient),
        );
      } else {
        const data = new PurchaseReceiptDto();
        Object.assign(data, body);
        data.items = [item];
        purchaseReceipts.push(data);
      }
    });
    return purchaseReceipts;
  }

  generateBatchedReceipt(receipt: PurchaseReceiptItemDto, len: number) {
    const purchaseReceipts = [];
    from(receipt.serial_no)
      .pipe(
        map(serial => serial),
        bufferCount(200),
        switchMap(serials => {
          const data = new PurchaseReceiptItemDto();
          Object.assign(data, receipt);
          data.serial_no = serials;
          purchaseReceipts.push(data);
          return of(purchaseReceipts);
        }),
      )
      .subscribe();
    return purchaseReceipts;
  }

  batchValidateSerials(
    settings: ServerSettings,
    purchaseReceipt: PurchaseReceiptDto,
    clientHttpRequest,
  ) {
    const serials: string[] = this.getMappedSerials(purchaseReceipt);
    return from(serials).pipe(
      map(serial => serial),
      bufferCount(SERIAL_NO_VALIDATION_BATCH_SIZE),
      switchMap(data => {
        return this.validateFrappeSerials(
          settings,
          purchaseReceipt,
          clientHttpRequest,
          serials,
        ).pipe(
          switchMap(isValid => {
            return isValid === true
              ? of(true)
              : throwError(
                  new BadRequestException(
                    `${isValid} number of serials already exists`,
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
      purchase_invoice_name,
    );
    this.purchaseInvoiceService
      .insertMany([purchaseReceiptItems])
      .then(success => {})
      .catch(error => {});
    return;
  }

  mapPurchaseInvoiceMetaData(
    purchaseReceipt: PurchaseReceiptResponseInterface,
    clientHttpRequest,
    purchase_invoice_name,
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
      purchaseInvoiceReceiptItem.name = item.name || purchase_invoice_name;
      purchaseInvoiceReceiptItem.qty = item.qty;
      purchaseInvoiceReceiptItem.rate = item.rate;
      purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
      purchaseInvoiceReceiptItem.warehouse = item.warehouse;
      purchaseInvoiceReceiptItem.deliveredBy = clientHttpRequest.token.fullName;
      purchaseInvoiceReceiptItem.deliveredByEmail =
        clientHttpRequest.token.email;
      purchaseInvoiceReceiptItem.purchase_receipt_name = purchase_invoice_name;
      purchaseReceiptItems.push(purchaseInvoiceReceiptItem);
    });
    return purchaseReceiptItems;
  }

  mapPurchaseInvoiceReceipt(
    purchaseInvoicePayload: PurchaseReceiptDto,
  ): { body: PurchaseReceiptDto; item_count: number } {
    purchaseInvoicePayload.docstatus = 1;
    purchaseInvoicePayload.is_return = 0;
    let item_count = 0;
    purchaseInvoicePayload.items.filter(item => {
      item.serial_no = item.serial_no.join('\n');
      item_count += item.qty;
      return item;
    });
    const body = purchaseInvoicePayload;
    return { body, item_count };
  }
  async retrievePurchaseInvoice(uuid: string, req) {
    return;
  }

  async getPurchaseInvoiceList(offset, limit, sort, search, clientHttpRequest) {
    return;
  }
}
