import { Injectable, OnModuleInit, Inject, HttpService } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { of, throwError, Observable } from 'rxjs';
import { mergeMap, catchError, retry, switchMap } from 'rxjs/operators';
import { VALIDATE_AUTH_STRING } from '../../../constants/app-strings';
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

export const CREATE_PURCHASE_RECEIPT_JOB = 'CREATE_PURCHASE_RECEIPT_JOB';

@Injectable()
export class PurchaseReceiptSyncService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenService: DirectService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  async onModuleInit() {
    this.agenda.define(
      CREATE_PURCHASE_RECEIPT_JOB,
      { concurrency: 1 },
      async (job: any, done) => {
        // Please note done callback will work only when concurrency is provided.
        this.createPurchaseReceipt(job.attrs.data)
          .toPromise()
          .then(success => {
            return done();
          })
          .catch(err => {
            return done(err);
          });
      },
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
          (err.response && err.response.status === 403) ||
          (err.response.data &&
            err.response.data.exc.includes(VALIDATE_AUTH_STRING))
        ) {
          return this.tokenService.getUserAccessToken(job.token.email).pipe(
            mergeMap(token => {
              job.token.accessToken = token.accessToken;
              return throwError(err);
            }),
          );
        }
        if (err.response && err.response.status === 417) {
          return of({});
        }
        return throwError(err);
      }),
      retry(3),
    );
  }

  linkPurchaseWarranty(
    payload: PurchaseReceiptDto[],
    settings: ServerSettings,
  ) {
    payload.forEach(receipt => {
      receipt.items.forEach(item => {
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
      this.updatePurchaseReceiptSerials(purchaseReceiptMetaData);
      purchaseReceiptMany.push(...purchaseReceiptMetaData);
      i++;
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
      purchaseInvoiceReceiptItem.serial_no = item.serial_no.split('\n');
      purchaseInvoiceReceiptItem.deliveredBy = token.fullName;
      purchaseInvoiceReceiptItem.deliveredByEmail = token.email;
      purchaseReceiptItems.push(purchaseInvoiceReceiptItem);
    });
    return purchaseReceiptItems;
  }

  addToQueueNow(data: {
    payload: any;
    token: any;
    settings: any;
    purchase_invoice_name: string;
  }) {
    data.payload.forEach(element => {
      if (typeof element.items[0].serial_no !== 'string') {
        try {
          element.items[0].serial_no = element.items[0].serial_no.join('\n');
        } catch {}
      }
    });
    this.agenda
      .now(CREATE_PURCHASE_RECEIPT_JOB, data)
      .then(success => {})
      .catch(err => {});
  }
}
