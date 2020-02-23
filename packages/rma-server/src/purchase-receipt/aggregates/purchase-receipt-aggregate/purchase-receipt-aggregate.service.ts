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
  concatMap,
} from 'rxjs/operators';
import { throwError, of, Observable, from } from 'rxjs';
import {
  FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT,
  FRAPPE_API_GET_DOCTYPE_COUNT,
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
  PURCHASE_RECEIPT_DOCTYPE_NAME,
  SERIAL_NO_DOCTYPE_NAME,
  MONGO_INSERT_MANY_BATCH_NUMBER,
} from '../../../constants/app-strings';
import { PurchaseReceiptResponseInterface } from '../../entity/purchase-receipt-response-interface';
import { PurchaseReceiptMetaData } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { PurchaseReceiptService } from '../../../purchase-receipt/entity/purchase-receipt.service';
import { FRAPPE_API_INSERT_MANY } from '../../../constants/routes';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

@Injectable()
export class PurchaseReceiptAggregateService extends AggregateRoot {
  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly purchaseReceiptPolicyService: PurchaseReceiptPoliciesService,
    private readonly errorLogService: ErrorLogService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
    private readonly serialNoService: SerialNoService,
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

              return item_count < 500
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
    serialsNo?: {
      serials: string[];
      createSerialsBatch: { [key: string]: string[] };
    },
    bulk?: boolean,
  ): Observable<boolean | number> {
    bulk ? bulk : false;
    const { serials, createSerialsBatch } = serialsNo
      ? serialsNo
      : this.getMappedSerials(body);
    const frappeBody = {
      doctype: 'Serial No',
      filters: { serial_no: ['in', serials], warehouse: ['!=', ''] },
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
            return bulk
              ? of(true)
              : this.createFrappeSerials(
                  createSerialsBatch,
                  body,
                  settings,
                  clientHttpRequest,
                );
          }
          return of(response.message);
        }),
      );
  }

  createFrappeSerials(
    createSerialsBatch,
    body: PurchaseReceiptDto,
    settings: ServerSettings,
    clientHttpRequest,
  ) {
    const keys = Object.keys(createSerialsBatch);
    return from(keys).pipe(
      mergeMap(item_code => {
        return this.mapItemsCodeToSerials(
          item_code,
          createSerialsBatch,
          body,
          body.items[0],
        );
      }),
      bufferCount(MONGO_INSERT_MANY_BATCH_NUMBER),
      concatMap(data => {
        return from(
          this.serialNoService.insertMany(data, { ordered: true }),
        ).pipe(
          switchMap(success => {
            return of(true);
          }),
          catchError(error => {
            return of(true);
          }),
        );
      }),
      retry(3),
      catchError(err => {
        return throwError(new BadRequestException(err));
      }),
    );
  }

  mapItemsCodeToSerials(
    item_code: string,
    createdSerialsBatch: { [key: string]: string[] },
    purchaseReceipt: PurchaseReceiptDto,
    item: PurchaseReceiptItemDto,
  ) {
    return from(createdSerialsBatch[item_code]).pipe(
      mergeMap(data => {
        return of({
          doctype: SERIAL_NO_DOCTYPE_NAME,
          serial_no: data,
          item_code,
          purchase_date: purchaseReceipt.posting_date,
          purchase_time: purchaseReceipt.posting_time,
          purchase_rate: item.rate,
          supplier: purchaseReceipt.supplier,
          company: purchaseReceipt.company,
        });
      }),
    );
  }

  getMappedSerials(
    purchaseReceipt: PurchaseReceiptDto,
  ): SerialMapResponseInterface {
    const createSerialsBatch: { [key: string]: string[] } = {};
    const serials = [];
    purchaseReceipt.items.forEach(element => {
      const serial = element.serial_no.split('\n');
      if (createSerialsBatch[element.item_code]) {
        createSerialsBatch[element.item_code].push(...serial);
      } else {
        createSerialsBatch[element.item_code] = serials;
      }
      serials.push(...serial);
    });
    return { serials, createSerialsBatch };
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

  createBatchedFrappeSerials(
    settings,
    body,
    clientHttpRequest,
    purchase_invoice_name,
    batch: SerialMapResponseInterface,
  ) {
    return from(
      this.createFrappeSerials(
        batch.createSerialsBatch,
        body,
        settings,
        clientHttpRequest,
      ),
    )
      .pipe(
        switchMap(data => {
          return of(true);
        }),
        switchMap(success => {
          this.createBatchedPurchaseReceipts(
            settings,
            body,
            clientHttpRequest,
            purchase_invoice_name,
          );
          return of({});
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            PURCHASE_RECEIPT_DOCTYPE_NAME,
            'purchaseInvoice',
            clientHttpRequest,
          );
        },
      });
  }

  batchPurchaseReceipt(
    settings: ServerSettings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name: string,
  ) {
    return this.batchValidateSerials(settings, body, clientHttpRequest).pipe(
      switchMap((batch: SerialMapResponseInterface) => {
        this.createBatchedFrappeSerials(
          settings,
          body,
          clientHttpRequest,
          purchase_invoice_name,
          batch,
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
    return from(purchaseReceipts)
      .pipe(
        switchMap(receipts => {
          try {
            receipts.serial_no = receipts.serial_no.join('\n');
          } catch {
            receipts.serial_no = receipts.serial_no;
          }
          const data: any = new PurchaseReceiptDto();
          Object.assign(data, body);
          data.items = [receipts];
          data.doctype = PURCHASE_RECEIPT_DOCTYPE_NAME;
          data.owner = clientHttpRequest.token.email;
          return of(data);
        }),
        bufferCount(FRAPPE_INSERT_MANY_BATCH_COUNT),
        concatMap(receipt => {
          return this.frappeInsertMany(settings, receipt, clientHttpRequest);
        }),
        retry(3),
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
            const purchaseReceiptMetaData = this.mapPurchaseReceiptMetaData(
              item,
              clientHttpRequest,
              purchase_invoice_name,
            );
            this.updatePurchaseReceiptSerials(purchaseReceiptMetaData);
            purchaseReceiptMany.push(...purchaseReceiptMetaData);
          });

          this.purchaseReceiptService
            .insertMany(purchaseReceiptMany)
            .then(done => {})
            .catch(error => {});

          purchaseReceiptMany.forEach(element => {
            this.serialNoService
              .updateMany(
                { serial_no: { $in: element.serial_no } },
                {
                  $set: {
                    warehouse: element.warehouse,
                    purchase_document_type: element.purchase_document_type,
                    purchase_document_no: element.purchase_document_no,
                  },
                },
              )
              .then(done => {})
              .catch(error => {});
          });
        },
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            PURCHASE_RECEIPT_DOCTYPE_NAME,
            'purchaseInvoice',
            clientHttpRequest,
          );
        },
      });
  }

  frappeInsertMany(
    settings: ServerSettings,
    body,
    clientHttpRequest,
  ): Observable<any> {
    return this.http.post<any>(
      settings.authServerURL + FRAPPE_API_INSERT_MANY,
      { docs: JSON.stringify(body) },
      {
        headers: this.settingsService.getAuthorizationHeaders(
          clientHttpRequest.token,
        ),
        timeout: 10000000,
      },
    );
  }

  getMapPurchaseReceipts(body: PurchaseReceiptDto) {
    const purchaseReceipts = [];
    body.items.forEach(item => {
      if (item.qty > PURCHASE_RECEIPT_BATCH_SIZE) {
        const quotient = Math.floor(item.qty / PURCHASE_RECEIPT_BATCH_SIZE);
        const remainder = item.qty % PURCHASE_RECEIPT_BATCH_SIZE;
        const serials = item.serial_no.split('\n');
        if (remainder) {
          const offsetItem = new PurchaseReceiptItemDto();
          Object.assign(offsetItem, item);
          const serialsNo = serials.splice(0, remainder);
          offsetItem.qty = remainder;
          offsetItem.amount = offsetItem.qty * offsetItem.rate;
          offsetItem.serial_no = serialsNo;
          purchaseReceipts.push(offsetItem);
        }
        const quotientItem = new PurchaseReceiptItemDto();
        Object.assign(quotientItem, item);
        quotientItem.qty = 200;
        quotientItem.amount = quotientItem.qty * quotientItem.rate;
        quotientItem.serial_no = serials;
        purchaseReceipts.push(
          ...this.generateBatchedReceipt(quotientItem, quotient),
        );
      } else {
        purchaseReceipts.push(item);
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
    const { serials, createSerialsBatch } = this.getMappedSerials(
      purchaseReceipt,
    );
    return from(serials).pipe(
      map(serial => serial),
      bufferCount(SERIAL_NO_VALIDATION_BATCH_SIZE),
      concatMap(data => {
        return this.validateFrappeSerials(
          settings,
          purchaseReceipt,
          clientHttpRequest,
          { serials, createSerialsBatch },
          true,
        ).pipe(
          switchMap(isValid => {
            return isValid === true
              ? of({ serials, createSerialsBatch })
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
    this.purchaseInvoiceService
      .updateOne(
        { name: purchase_invoice_name },
        {
          $push: {
            purchase_receipt_names: { $each: [purchaseReceipt.name] },
          },
          $set: { status: COMPLETED_STATUS },
        },
      )
      .then(done => {})
      .catch(error => {});

    const purchaseReceipts = this.mapPurchaseReceiptMetaData(
      purchaseReceipt,
      clientHttpRequest,
      purchase_invoice_name,
    );

    this.purchaseReceiptService
      .insertMany(purchaseReceipts)
      .then(done => {})
      .catch(error => {});

    this.updatePurchaseReceiptSerials(purchaseReceipts);
  }

  updatePurchaseReceiptSerials(purchaseReceipts: PurchaseReceiptMetaData[]) {
    purchaseReceipts.forEach(element => {
      this.serialNoService
        .updateMany(
          { serial_no: { $in: element.serial_no } },
          {
            $set: {
              warehouse: element.warehouse,
              purchase_document_type: element.purchase_document_type,
              purchase_document_no: element.purchase_document_no,
            },
          },
        )
        .then(success => {})
        .catch(error => {});
    });
  }

  mapPurchaseReceiptMetaData(
    purchaseReceipt: PurchaseReceiptResponseInterface,
    clientHttpRequest,
    purchase_invoice_name,
  ): PurchaseReceiptMetaData[] {
    const purchaseReceiptItems = [];
    purchaseReceipt.items.forEach(item => {
      const purchaseInvoiceReceiptItem = new PurchaseReceiptMetaData();
      purchaseInvoiceReceiptItem.purchase_document_type =
        item.purchase_document_type;
      purchaseInvoiceReceiptItem.purchase_document_no =
        item.purchase_document_no;
      purchaseInvoiceReceiptItem.purchase_receipt_name = purchaseReceipt.name;
      purchaseInvoiceReceiptItem.amount = item.amount;
      purchaseInvoiceReceiptItem.cost_center = item.cost_center;
      purchaseInvoiceReceiptItem.expense_account = item.expense_account;
      purchaseInvoiceReceiptItem.item_code = item.item_code;
      purchaseInvoiceReceiptItem.item_name = item.item_name;
      purchaseInvoiceReceiptItem.name = item.name || purchase_invoice_name;
      purchaseInvoiceReceiptItem.qty = item.qty;
      purchaseInvoiceReceiptItem.rate = item.rate;
      purchaseInvoiceReceiptItem.warehouse = item.warehouse;
      purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
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

export class SerialMapResponseInterface {
  createSerialsBatch: {
    [key: string]: string[];
  };
  serials: string[];
}
