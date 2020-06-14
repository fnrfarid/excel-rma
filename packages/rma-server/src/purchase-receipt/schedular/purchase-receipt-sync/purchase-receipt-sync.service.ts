import { Injectable, Inject, HttpService } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { of, throwError, Observable, from } from 'rxjs';
import {
  mergeMap,
  catchError,
  switchMap,
  concatMap,
  toArray,
  retry,
} from 'rxjs/operators';
import {
  VALIDATE_AUTH_STRING,
  FRAPPE_QUEUE_JOB,
  AGENDA_JOB_STATUS,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { FRAPPE_API_INSERT_MANY } from '../../../constants/routes';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseReceiptService } from '../../entity/purchase-receipt.service';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptResponseInterface } from '../../entity/purchase-receipt-response-interface';
import { PurchaseReceiptMetaData } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseReceiptDto } from '../../entity/purchase-receipt-dto';
import { AgendaJobService } from '../../../sync/entities/agenda-job/agenda-job.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';

export const CREATE_PURCHASE_RECEIPT_JOB = 'CREATE_PURCHASE_RECEIPT_JOB';
@Injectable()
export class PurchaseReceiptSyncService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly jobService: AgendaJobService,
    private readonly purchaseReceiptPolicies: PurchaseReceiptPoliciesService,
  ) {}

  execute(job) {
    return this.createPurchaseReceipt(job.attrs.data);
  }

  resetState(job: {
    data: {
      payload: PurchaseReceiptDto[];
      token: any;
      settings: ServerSettings;
      purchase_invoice_name: string;
    };
  }) {
    const item_hash = { serials: [] };
    return of({}).pipe(
      switchMap(parent => {
        return from(job.data.payload);
      }),
      switchMap(purchaseReceipt => {
        return from(purchaseReceipt.items).pipe(
          switchMap(item => {
            if (item_hash[item.item_code]) {
              item_hash[item.item_code] += item.qty;
            } else {
              item_hash[item.item_code] = item.qty;
            }
            if (item.has_serial_no) {
              if (typeof item.serial_no === 'string') {
                item_hash.serials.push(...item.serial_no.split('\n'));
              } else {
                item_hash.serials.push(...item.serial_no);
              }
            }
            return of({});
          }),
        );
      }),
      toArray(),
      switchMap(success => {
        const decrementQuery = {};
        const item_codes = Object.keys(item_hash);
        item_codes.forEach(code => {
          if (code === 'serials') {
            return;
          }
          decrementQuery[`purchase_receipt_items_map.${code}`] = -item_hash[
            code
          ];
        });
        return from(
          this.purchaseInvoiceService.updateOne(
            { name: job.data.purchase_invoice_name },
            { $inc: decrementQuery },
          ),
        );
      }),
      switchMap(done => {
        return from(
          this.serialNoService.updateMany(
            { serial_no: { $in: item_hash.serials } },
            { $unset: { 'queue_state.purchase_receipt': undefined } },
          ),
        );
      }),
    );
  }

  createPurchaseReceipt(job: {
    payload: any;
    token: any;
    settings: any;
    purchase_invoice_name: string;
  }) {
    return of({}).pipe(
      mergeMap(object => {
        return this.frappeInsertMany(job.settings, job.payload, job.token).pipe(
          switchMap((success: any) => {
            this.linkPurchaseReceipt(
              success,
              job.purchase_invoice_name,
              job.token,
            );
            this.linkPurchaseWarranty(job.payload, job.settings);
            return of({});
          }),
        );
      }),
      catchError(err => {
        if (
          (err && err.response && err.response.status === 403) ||
          (err &&
            err.response &&
            err.response.data &&
            err.response.data.exc &&
            err.response.data.exc.includes(VALIDATE_AUTH_STRING))
        ) {
          return this.tokenService.getUserAccessToken(job.token.email).pipe(
            mergeMap(token => {
              this.jobService.updateJobTokens(
                job.token.accessToken,
                token.accessToken,
              );
              job.token.accessToken = token.accessToken;
              return throwError(err);
            }),
            catchError(error => {
              return throwError(err);
            }),
          );
        }
        if (
          (err &&
            err.response &&
            err.response.data &&
            err.response.data.exc &&
            (err.response.data.exc.includes('SerialNoDuplicateError') ||
              err.response.data.exc.includes('has already been received'))) ||
          err.response.data.exc.includes('BaseDocument') ||
          err.response.data.exc.includes('ValueError')
        ) {
          return this.syncExistingSerials(job, err);
        }
        // new approach, we wont reset state let the user retry it from agenda UI.
        return throwError(err);
      }),
      retry(3),
    );
  }

  linkPurchaseWarranty(
    payload: PurchaseReceiptDto[],
    settings: ServerSettings,
  ) {
    const hash_map = {};

    payload.forEach(receipt => {
      receipt.items.forEach(item => {
        if (!item.has_serial_no) {
          return;
        }

        if (!hash_map[item.item_code]) {
          hash_map[item.item_code] = { serials: [] };
        }

        if (typeof item.serial_no === 'string') {
          hash_map[item.item_code].serials.push(...item.serial_no.split('\n'));
        } else {
          hash_map[item.item_code].serials.push(...item.serial_no);
        }
        hash_map[item.item_code].warranty_date = item.warranty_date;
      });
    });

    return from(Object.keys(hash_map))
      .pipe(
        switchMap(key => {
          return from(
            this.serialNoService.updateMany(
              { serial_no: { $in: hash_map[key].serials } },
              {
                $set: {
                  'warranty.purchaseWarrantyDate': hash_map[key].warranty_date,
                  'warranty.purchasedOn': new DateTime(
                    settings.timeZone,
                  ).toJSDate(),
                },
                $unset: { 'queue_state.purchase_receipt': undefined },
              },
            ),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  frappeInsertMany(settings: ServerSettings, body, token): Observable<any> {
    return this.http.post<any>(
      settings.authServerURL + FRAPPE_API_INSERT_MANY,
      { docs: JSON.stringify(body) },
      {
        headers: this.settingsService.getAuthorizationHeaders(token),
        timeout: 10000000,
      },
    );
  }

  linkPurchaseReceipt(
    success: { data: { message: string[] }; config: any },
    purchase_invoice_name,
    token,
  ) {
    this.purchaseInvoiceService
      .updateOne(
        { name: purchase_invoice_name },
        {
          $push: {
            purchase_receipt_names: { $each: success.data.message },
          },
        },
      )
      .then(done => {})
      .catch(error => {});

    const purchaseReceiptMany = [];
    const data = JSON.parse(JSON.parse(success.config.data).docs);
    let i = 0;
    data.forEach(item => {
      const purchaseReceiptMetaData = this.mapPurchaseReceiptMetaData(
        item,
        token,
        purchase_invoice_name,
        success.data.message[i],
      );
      this.updatePurchaseReceiptSerials(
        purchaseReceiptMetaData,
        purchase_invoice_name,
      );
      purchaseReceiptMany.push(...purchaseReceiptMetaData);
      i++;
    });

    this.purchaseReceiptService
      .insertMany(purchaseReceiptMany)
      .then(done => {})
      .catch(error => {});
  }

  updatePurchaseReceiptSerials(
    purchaseReceipts: PurchaseReceiptMetaData[],
    purchase_invoice_name,
  ) {
    return from(purchaseReceipts)
      .pipe(
        concatMap(
          (receipt: {
            serial_no: any;
            warehouse: string;
            purchase_document_no: string;
            purchase_document_type: string;
          }) => {
            try {
              return of({
                element: receipt,
                serials: receipt.serial_no.split('\n'),
              });
            } catch {
              return of({
                element: receipt,
                serials: receipt.serial_no,
              });
            }
          },
        ),
        switchMap(({ serials, element }) => {
          if (serials) {
            this.updateSerials(element, serials, purchase_invoice_name);
          }
          return of({});
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  updateSerials(
    element: {
      warehouse: string;
      purchase_document_no: string;
      purchase_document_type: string;
    },
    serials: string[],
    purchase_invoice_name,
  ) {
    this.serialNoService
      .updateMany(
        { serial_no: { $in: serials } },
        {
          $set: {
            purchase_invoice_name,
            warehouse: element.warehouse,
            purchase_document_type: element.purchase_document_type,
            purchase_document_no: element.purchase_document_no,
          },
          $unset: { 'queue_state.purchase_receipt': undefined },
        },
      )
      .then(success => {})
      .catch(error => {});
  }

  mapPurchaseReceiptMetaData(
    purchaseReceipt: PurchaseReceiptResponseInterface,
    token,
    purchase_invoice_name,
    purchase_receipt_name,
  ): PurchaseReceiptMetaData[] {
    const purchaseReceiptItems = [];
    purchaseReceipt.items.forEach(item => {
      const purchaseInvoiceReceiptItem = new PurchaseReceiptMetaData();
      purchaseInvoiceReceiptItem.purchase_document_type =
        purchaseReceipt.doctype;
      purchaseInvoiceReceiptItem.purchase_document_no = purchase_receipt_name;
      purchaseInvoiceReceiptItem.purchase_invoice_name = purchase_invoice_name;
      purchaseInvoiceReceiptItem.amount = item.amount;
      purchaseInvoiceReceiptItem.cost_center = item.cost_center;
      purchaseInvoiceReceiptItem.expense_account = item.expense_account;
      purchaseInvoiceReceiptItem.item_code = item.item_code;
      purchaseInvoiceReceiptItem.item_name = item.item_name;
      purchaseInvoiceReceiptItem.name = purchase_receipt_name;
      purchaseInvoiceReceiptItem.qty = item.qty;
      purchaseInvoiceReceiptItem.rate = item.rate;
      purchaseInvoiceReceiptItem.warehouse = item.warehouse;
      if (item.serial_no) {
        purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
      }
      purchaseInvoiceReceiptItem.deliveredBy = token.fullName;
      purchaseInvoiceReceiptItem.deliveredByEmail = token.email;
      purchaseReceiptItems.push(purchaseInvoiceReceiptItem);
    });
    return purchaseReceiptItems;
  }

  syncExistingSerials(
    job: {
      payload: PurchaseReceiptDto[];
      token: any;
      settings: any;
      purchase_invoice_name: string;
    },
    err,
  ) {
    const serials = [];
    let purchase_order;
    job.payload.forEach(receipt => {
      receipt.items.forEach(item => {
        if (item.has_serial_no) {
          purchase_order = item.purchase_order;
          if (typeof item.serial_no === 'string') {
            serials.push(...item.serial_no.split('\n'));
          } else {
            serials.push(...item.serial_no);
          }
        }
      });
    });
    if (!purchase_order) {
      return throwError('Purchase Order is missing form items.');
    }

    return this.purchaseReceiptPolicies
      .validateFrappeSyncExistingSerials(
        serials,
        job.settings,
        job.token,
        purchase_order,
      )
      .pipe(
        switchMap(
          (
            response: {
              purchase_document_no: string;
              name: string;
              warehouse: string;
            }[],
          ) => {
            return this.linkSyncedPurchaseReceipt(
              response,
              job.purchase_invoice_name,
              job.token,
            );
          },
        ),
        switchMap(success => {
          this.linkPurchaseWarranty(job.payload, job.settings);
          this.purchaseInvoiceService
            .updateOne(
              { name: job.purchase_invoice_name },
              {
                $push: {
                  purchase_receipt_names: { $each: success },
                },
              },
            )
            .then(done => {})
            .catch(fail => {});
          return of({});
        }),
      );
  }

  linkSyncedPurchaseReceipt(
    response: {
      purchase_document_no: string;
      name: string;
      warehouse: string;
    }[],
    purchase_invoice_name: string,
    token,
  ) {
    const hash_map: { serials?: string[]; warehouse?: string } = {};
    // { key : value} > key = purchase_doc_no , value.serials = array of serials { doc-1 : { serials : [1,2,3], warehouse:"Warehouse-A"}}
    response.forEach(element => {
      if (!hash_map[element.purchase_document_no]) {
        hash_map[element.purchase_document_no] = { serials: [] };
      }
      hash_map[element.purchase_document_no].serials.push(element.name);
      hash_map[element.purchase_document_no].warehouse = element.warehouse;
    });
    return from(Object.keys(hash_map)).pipe(
      switchMap(key => {
        return from(
          this.serialNoService.updateMany(
            { serial_no: { $in: hash_map[key].serials } },
            {
              $set: {
                purchase_invoice_name,
                warehouse: hash_map[key].warehouse,
                purchase_document_type: 'Purchase Receipt',
                purchase_document_no: key,
              },
              $unset: { 'queue_state.purchase_receipt': undefined },
            },
          ),
        );
      }),
      switchMap(success => {
        // add an observable to create missing purchase receipt, not necessary for now, later on this could be added.
        return of(Object.keys(hash_map));
      }),
    );
  }

  addToQueueNow(data: {
    payload: any;
    token: any;
    settings: any;
    purchase_invoice_name: string;
    type?: string;
    parent?: string;
    status?: string;
  }) {
    data.type = CREATE_PURCHASE_RECEIPT_JOB;
    for (const element of data.payload) {
      if (typeof element.items[0].serial_no !== 'string') {
        try {
          element.items[0].serial_no = element.items[0].serial_no.join('\n');
        } catch {}
      }
    }
    data.parent = data.purchase_invoice_name;
    data.status = AGENDA_JOB_STATUS.in_queue;
    this.agenda
      .now(FRAPPE_QUEUE_JOB, data)
      .then(success => {})
      .catch(err => {});
  }
}
