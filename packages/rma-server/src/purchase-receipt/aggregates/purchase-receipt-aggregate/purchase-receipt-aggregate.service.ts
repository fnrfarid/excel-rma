import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { DateTime } from 'luxon';
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
  toArray,
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
  PURCHASE_RECEIPT_SERIALS_BATCH_SIZE,
  FRAPPE_INSERT_MANY_BATCH_COUNT,
  PURCHASE_RECEIPT_DOCTYPE_NAME,
  SERIAL_NO_DOCTYPE_NAME,
  MONGO_INSERT_MANY_BATCH_NUMBER,
  SERIAL_NO_VALIDATION_BATCH_SIZE,
  SUBMITTED_STATUS,
} from '../../../constants/app-strings';
import { PurchaseReceiptResponseInterface } from '../../entity/purchase-receipt-response-interface';
import {
  PurchaseReceiptMetaData,
  PurchaseInvoice,
} from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { PurchaseReceiptService } from '../../../purchase-receipt/entity/purchase-receipt.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { INVALID_FILE } from '../../../constants/app-strings';
import { PurchaseReceiptSyncService } from '../../schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import { PurchaseOrderService } from '../../../purchase-order/entity/purchase-order/purchase-order.service';

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
    private readonly prSyncService: PurchaseReceiptSyncService,
    private readonly purchaseOrderService: PurchaseOrderService,
  ) {
    super();
  }

  addPurchaseReceipt(
    purchaseInvoicePayload: PurchaseReceiptDto,
    clientHttpRequest,
    file?,
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
              return item_count < 20
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

  purchaseReceiptFromFile(file, req) {
    return from(this.getJsonData(file)).pipe(
      switchMap((data: PurchaseReceiptDto) => {
        if (!data) {
          return throwError(new BadRequestException(INVALID_FILE));
        }
        return this.addPurchaseReceipt(data, req);
      }),
    );
  }

  getJsonData(file) {
    return of(JSON.parse(file.buffer));
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
    bulk = bulk ? bulk : false;

    const { serials, createSerialsBatch } = serialsNo
      ? serialsNo
      : this.getMappedSerials(body);

    if (!serials || serials.length === 0) {
      return of(true);
    }
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
              : this.createFrappeSerials(createSerialsBatch, body);
          }
          return of(response.message);
        }),
      );
  }

  createFrappeSerials(createSerialsBatch, body: PurchaseReceiptDto) {
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
      switchMap(data => {
        return from(this.serialNoService.insertMany(data, { ordered: true }));
      }),
      retry(3),
      switchMap(success => {
        return of(true);
      }),
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
      mergeMap(serial => {
        return of({
          doctype: SERIAL_NO_DOCTYPE_NAME,
          serial_no: serial,
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
    // Something fucked up
    for (const element of purchaseReceipt.items) {
      if (element.has_serial_no) {
        const serial = element.serial_no.split('\n');
        if (createSerialsBatch[element.item_code]) {
          createSerialsBatch[element.item_code].push(...serial);
        } else {
          createSerialsBatch[element.item_code] = serial;
        }
        for (const serial_no of serial) {
          serials.push(serial_no);
        }
      }
    }
    return { serials, createSerialsBatch };
  }

  createFrappePurchaseReceipt(
    settings: ServerSettings,
    payload: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name: string,
  ) {
    return from(
      this.purchaseOrderService.findOne({ purchase_invoice_name }),
    ).pipe(
      switchMap(purchaseOrder => {
        if (!purchaseOrder) {
          return throwError(
            new BadRequestException(
              'Purchase Order not found for provided invoice.',
            ),
          );
        }
        payload.items.filter(item => {
          item.purchase_order = purchaseOrder.name;
          if (!item.has_serial_no) {
            delete item.serial_no;
          }
        });
        return this.http
          .post(
            settings.authServerURL + FRAPPE_API_PURCHASE_RECEIPT_ENDPOINT,
            payload,
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
            switchMap((purchaseReceipt: PurchaseReceiptResponseInterface) => {
              this.updatePurchaseReceiptItemsMap(
                purchase_invoice_name,
                payload,
              );
              this.linkPurchaseInvoice(
                purchaseReceipt,
                purchase_invoice_name,
                clientHttpRequest,
              );
              this.linkPurchaseWarranty(payload, settings);
              return of({});
            }),
          );
      }),
    );
  }

  linkPurchaseWarranty(payload: PurchaseReceiptDto, settings: ServerSettings) {
    payload.items.forEach(item => {
      if (!item.has_serial_no) {
        return;
      }

      if (typeof item.serial_no === 'string') {
        item.serial_no = item.serial_no.split('\n');
      }

      this.serialNoService
        .updateMany(
          { serial_no: { $in: item.serial_no } },
          {
            $set: {
              'warranty.purchaseWarrantyDate': item.warranty_date,
              'warranty.purchasedOn': new DateTime(
                settings.timeZone,
              ).toJSDate(),
            },
          },
        )
        .then(success => {})
        .catch(err => {});
    });
  }

  createBatchedFrappeSerials(
    settings,
    body: PurchaseReceiptDto,
    clientHttpRequest,
    purchase_invoice_name,
    batch: SerialMapResponseInterface,
  ) {
    this.updatePurchaseReceiptItemsMap(purchase_invoice_name, body);

    return from(this.createFrappeSerials(batch.createSerialsBatch, body))
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
    return from(this.purchaseOrderService.findOne({ purchase_invoice_name }))
      .pipe(
        switchMap(purchaseOrder => {
          return from(purchaseReceipts).pipe(
            concatMap(receipts => {
              receipts.purchase_order = purchaseOrder.name;
              const data: any = new PurchaseReceiptDto();
              Object.assign(data, body);
              data.items = [receipts];
              data.doctype = PURCHASE_RECEIPT_DOCTYPE_NAME;
              data.owner = clientHttpRequest.token.email;
              return of(data);
            }),
            bufferCount(FRAPPE_INSERT_MANY_BATCH_COUNT),
            concatMap(receipt => {
              this.prSyncService.addToQueueNow({
                payload: receipt,
                token: clientHttpRequest.token,
                settings,
                purchase_invoice_name,
              });
              return of({});
            }),
          );
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

  getSplicedSerials(serial_no: any) {
    if (typeof serial_no === 'object') {
      return serial_no.join('\n');
    } else {
      return serial_no;
    }
  }

  getMapPurchaseReceipts(body: PurchaseReceiptDto) {
    const purchaseReceipts = [];
    for (const item of body.items) {
      if (item.qty > PURCHASE_RECEIPT_SERIALS_BATCH_SIZE) {
        if (!item.has_serial_no) {
          const receiptItem = new PurchaseReceiptItemDto();
          Object.assign(receiptItem, item);
          receiptItem.serial_no = undefined;
          purchaseReceipts.push(receiptItem);
          return;
        }

        const remainder = item.qty % PURCHASE_RECEIPT_SERIALS_BATCH_SIZE;
        const serials = item.serial_no.split('\n');

        if (remainder) {
          const offsetItem = new PurchaseReceiptItemDto();
          Object.assign(offsetItem, item);
          const serialsNo = serials.splice(0, remainder);
          offsetItem.qty = remainder;
          offsetItem.amount = offsetItem.qty * offsetItem.rate;
          offsetItem.serial_no = this.getSplicedSerials(serialsNo);
          purchaseReceipts.push(offsetItem);
        }

        const quotientItem = new PurchaseReceiptItemDto();
        Object.assign(quotientItem, item);
        quotientItem.qty = PURCHASE_RECEIPT_SERIALS_BATCH_SIZE;
        quotientItem.amount = quotientItem.qty * quotientItem.rate;
        quotientItem.serial_no = serials;
        const generatedReceipts = this.generateBatchedReceipt(quotientItem);
        for (const receipt of generatedReceipts) {
          purchaseReceipts.push(receipt);
        }
      } else {
        item.serial_no = this.getSplicedSerials(item.serial_no);
        purchaseReceipts.push(item);
      }
    }

    return purchaseReceipts;
  }

  generateBatchedReceipt(receipt: PurchaseReceiptItemDto) {
    const purchaseReceipts = [];
    from(receipt.serial_no)
      .pipe(
        map(serial => serial),
        bufferCount(PURCHASE_RECEIPT_SERIALS_BATCH_SIZE),
        switchMap(serials => {
          const data = new PurchaseReceiptItemDto();
          Object.assign(data, receipt);
          data.serial_no = this.getSplicedSerials(serials);
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
      concatMap((data: string[]) => {
        return this.validateFrappeSerials(
          settings,
          purchaseReceipt,
          clientHttpRequest,
          { serials: data, createSerialsBatch },
          true,
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
      toArray(),
      switchMap(isValid => {
        return of({ serials, createSerialsBatch });
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
        purchaseReceipt.doctype;
      purchaseInvoiceReceiptItem.purchase_document_no = purchaseReceipt.name;
      purchaseInvoiceReceiptItem.purchase_invoice_name = purchase_invoice_name;
      purchaseInvoiceReceiptItem.amount = item.amount;
      purchaseInvoiceReceiptItem.cost_center = item.cost_center;
      purchaseInvoiceReceiptItem.expense_account = item.expense_account;
      purchaseInvoiceReceiptItem.item_code = item.item_code;
      purchaseInvoiceReceiptItem.item_name = item.item_name;
      purchaseInvoiceReceiptItem.name = purchaseReceipt.name;
      purchaseInvoiceReceiptItem.qty = item.qty;
      purchaseInvoiceReceiptItem.rate = item.rate;
      purchaseInvoiceReceiptItem.warehouse = item.warehouse;
      purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
      purchaseInvoiceReceiptItem.deliveredBy = clientHttpRequest.token.fullName;
      purchaseInvoiceReceiptItem.deliveredByEmail =
        clientHttpRequest.token.email;
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
    for (const item of purchaseInvoicePayload.items) {
      item.serial_no = item.serial_no.join('\n');
      if (item.has_serial_no) {
        item_count += item.qty;
      }
    }
    const body = purchaseInvoicePayload;
    return { body, item_count };
  }

  getPurchaseReceiptItemsMap(
    items: PurchaseReceiptItemDto[],
    purchase_receipt_items_map: any,
  ) {
    items.forEach(item => {
      if (purchase_receipt_items_map[item.item_code]) {
        purchase_receipt_items_map[item.item_code] += item.qty;
      } else {
        purchase_receipt_items_map[item.item_code] = item.qty;
      }
    });
    return purchase_receipt_items_map;
  }

  updatePurchaseReceiptItemsMap(
    purchase_invoice_name: string,
    payload: PurchaseReceiptDto,
  ) {
    this.purchaseInvoiceService
      .findOne({ name: purchase_invoice_name })
      .then(purchase_invoice => {
        const purchase_receipt_items_map = this.getPurchaseReceiptItemsMap(
          payload.items,
          purchase_invoice.purchase_receipt_items_map,
        );
        const status = this.getStatus(
          purchase_invoice,
          purchase_receipt_items_map,
        );
        this.purchaseInvoiceService.updateOne(
          { name: purchase_invoice_name },
          { $set: { purchase_receipt_items_map, status } },
        );
      })
      .catch(() => {});
  }

  getStatus(
    purchase_invoice: PurchaseInvoice,
    purchase_receipt_items_map: any,
  ) {
    let total = 0;
    for (const key of Object.keys(purchase_receipt_items_map)) {
      total += purchase_receipt_items_map[key];
    }
    if (total === purchase_invoice.total_qty) return COMPLETED_STATUS;
    else return SUBMITTED_STATUS;
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
