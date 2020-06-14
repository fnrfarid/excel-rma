import { Injectable, Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { of, throwError, from } from 'rxjs';
import {
  mergeMap,
  catchError,
  switchMap,
  toArray,
  retry,
} from 'rxjs/operators';
import {
  VALIDATE_AUTH_STRING,
  FRAPPE_QUEUE_JOB,
  AGENDA_JOB_STATUS,
  SYNC_PURCHASE_RECEIPT_JOB,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseReceiptService } from '../../entity/purchase-receipt.service';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptDto } from '../../entity/purchase-receipt-dto';
import { FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB } from '../../../constants/app-strings';
import * as uuid from 'uuid/v4';
import { PURCHASE_RECEIPT_DOCTYPE_NAME } from '../../../constants/app-strings';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { PurchaseReceipt } from '../../entity/purchase-receipt.entity';
import { JsonToCSVParserService } from '../../../sync/entities/agenda-job/json-to-csv-parser.service';
import {
  DataImportService,
  SingleDoctypeResponseInterface,
} from '../../../sync/aggregates/data-import/data-import.service';
import { AgendaJobService } from '../../../sync/entities/agenda-job/agenda-job.service';
import {
  CSV_TEMPLATE_HEADERS,
  CSV_TEMPLATE,
} from '../../../sync/assets/data_import_template';
import { DataImportSuccessResponse } from '../../../sync/entities/agenda-job/agenda-job.entity';

export const CREATE_PURCHASE_RECEIPT_JOB = 'CREATE_PURCHASE_RECEIPT_JOB';
@Injectable()
export class PurchaseReceiptSyncService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenService: DirectService,
    private readonly csvService: JsonToCSVParserService,
    private readonly importData: DataImportService,
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly jobService: AgendaJobService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
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
    payload: PurchaseReceiptDto[];
    token: any;
    settings: any;
    purchase_invoice_name: string;
    parent: string;
    dataImport: any;
    uuid: string;
  }) {
    return of({}).pipe(
      mergeMap(object => {
        const payload = this.setCsvDefaults(job.payload, job.settings);
        const csvPayload = this.csvService.mapJsonToCsv(
          payload,
          CSV_TEMPLATE_HEADERS.purchase_receipt,
          CSV_TEMPLATE.purchase_receipt,
        );
        return this.importData.addDataImport(
          PURCHASE_RECEIPT_DOCTYPE_NAME,
          csvPayload,
          job.settings,
          job.token,
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
        return throwError(err);
      }),
      retry(3),
      switchMap((success: DataImportSuccessResponse) => {
        job.dataImport = success;
        job.uuid = uuid();
        this.addToExportedQueue(job);
        return of(true);
      }),
    );
  }

  setCsvDefaults(payload: PurchaseReceiptDto[], settings: ServerSettings) {
    const purchase_receipt = payload[0];

    purchase_receipt.naming_series = 'PD-';
    purchase_receipt.currency = 'BDT';
    purchase_receipt.selling_price_list = purchase_receipt.selling_price_list
      ? purchase_receipt.selling_price_list
      : settings.sellingPriceList;
    purchase_receipt.conversion_rate = purchase_receipt.conversion_rate
      ? purchase_receipt.conversion_rate
      : 1;
    purchase_receipt.status = purchase_receipt.status
      ? purchase_receipt.status
      : 'To Bill';

    purchase_receipt.items[0].base_total = purchase_receipt.items[0].amount;
    purchase_receipt.items[0].uom = purchase_receipt.items[0].uom
      ? purchase_receipt.items[0].uom
      : 'Nos';
    purchase_receipt.items[0].stock_uom = purchase_receipt.items[0].stock_uom
      ? purchase_receipt.items[0].stock_uom
      : 'Nos';
    purchase_receipt.items[0].conversion_factor = purchase_receipt.items[0]
      .conversion_factor
      ? purchase_receipt.items[0].conversion_factor
      : 1;

    return purchase_receipt;
  }

  linkPurchaseWarranty(
    payload: PurchaseReceiptDto[],
    doc: SingleDoctypeResponseInterface,
    token: TokenCache,
    settings: ServerSettings,
    parent: string,
  ) {
    const hash_map: {
      [key: string]: {
        serials?: string[];
        warranty_date?: string;
        warehouse?: string;
      };
    } = {};
    const purchase_receipts: PurchaseReceipt[] = this.mapPurchaseReceiptMetaData(
      doc,
      token,
      parent,
    );
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
        hash_map[item.item_code].warehouse = item.warehouse;
      });
    });

    this.purchaseReceiptService
      .insertMany(purchase_receipts)
      .then(success => {})
      .catch(err => {});

    return from(Object.keys(hash_map))
      .pipe(
        switchMap(key => {
          return from(
            this.serialNoService.updateMany(
              { serial_no: { $in: hash_map[key].serials } },
              {
                $set: {
                  purchase_invoice_name: parent,
                  warehouse: hash_map[key].warehouse,
                  purchase_document_type: PURCHASE_RECEIPT_DOCTYPE_NAME,
                  purchase_document_no: doc.name,
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
        switchMap(done => {
          return from(
            this.purchaseInvoiceService.updateOne(
              { name: parent },
              { $push: { purchase_receipt_names: doc.name } },
            ),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
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

  mapPurchaseReceiptMetaData(
    purchaseReceipt,
    token,
    purchase_invoice_name,
  ): PurchaseReceipt[] {
    const purchase_receipt_list = [];
    purchaseReceipt.items.forEach(item => {
      const purchase_receipt: any = {};
      purchase_receipt.purchase_document_type = purchaseReceipt.doctype;
      purchase_receipt.purchase_document_no = purchaseReceipt.name;
      purchase_receipt.purchase_invoice_name = purchase_invoice_name;
      purchase_receipt.amount = item.amount;
      purchase_receipt.cost_center = item.cost_center;
      purchase_receipt.expense_account = item.expense_account;
      purchase_receipt.item_code = item.item_code;
      purchase_receipt.item_name = item.item_name;
      purchase_receipt.qty = item.qty;
      purchase_receipt.rate = item.rate;
      purchase_receipt.warehouse = item.warehouse;
      if (item.serial_no) {
        purchase_receipt.serial_no = item.serial_no.split('\n');
      }
      purchase_receipt.deliveredBy = token.fullName;
      purchase_receipt.deliveredByEmail = token.email;
      purchase_receipt_list.push(purchase_receipt);
    });
    return purchase_receipt_list;
  }

  syncImport(job) {
    return this.importData.syncImport(job, PURCHASE_RECEIPT_DOCTYPE_NAME).pipe(
      switchMap(
        (response: {
          parent_job: { value: { data: any } };
          state: { doc: any };
        }) => {
          const parent_data = response.parent_job.value.data;
          this.linkPurchaseWarranty(
            parent_data.payload,
            response.state.doc,
            parent_data.token,
            job.settings,
            parent_data.parent,
          );
          return of();
        },
      ),
    );
  }

  addToExportedQueue(job: {
    dataImport: DataImportSuccessResponse;
    uuid: string;
    settings: ServerSettings;
    parent: string;
    token: any;
  }) {
    const job_data = {
      payload: job.dataImport,
      uuid: job.uuid,
      type: SYNC_PURCHASE_RECEIPT_JOB,
      settings: job.settings,
      token: job.token,
      parent: job.parent,
    };
    return this.agenda.now(FRAPPE_SYNC_DATA_IMPORT_QUEUE_JOB, job_data);
  }
}
