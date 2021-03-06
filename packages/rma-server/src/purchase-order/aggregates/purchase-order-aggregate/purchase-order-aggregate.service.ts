import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { PurchaseOrderPoliciesService } from '../../policies/purchase-order-policies/purchase-order-policies.service';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';
import { catchError, concatMap, switchMap, toArray } from 'rxjs/operators';
import { forkJoin, from, of, throwError } from 'rxjs';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseOrder } from '../../entity/purchase-order/purchase-order.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { FRAPPE_CLIENT_CANCEL } from '../../../constants/routes';
import {
  DOC_NAMES,
  AUTHORIZATION,
  PURCHASE_INVOICE_STATUS,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import { PurchaseReceiptService } from '../../../purchase-receipt/entity/purchase-receipt.service';

@Injectable()
export class PurchaseOrderAggregateService extends AggregateRoot {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchaseOrderPolicy: PurchaseOrderPoliciesService,
    private readonly serialHistoryService: SerialNoHistoryService,
    private readonly serialNoService: SerialNoService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly serverSettings: SettingsService,
    private readonly http: HttpService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
  ) {
    super();
  }

  async retrievePurchaseOrder(params) {
    return await this.purchaseOrderService.findOne(params);
  }

  getPurchaseOrderList(
    offset: number,
    limit: number,
    sort: string,
    filter_query: any,
  ) {
    return this.purchaseOrderService.list(offset, limit, sort, filter_query);
  }

  resetOrder(name: string, req) {
    return this.serverSettings.find().pipe(
      switchMap(settings => {
        return this.purchaseOrderPolicy
          .validatePurchaseOrderReset(name, settings, req)
          .pipe(
            switchMap((docs: { [key: string]: string[] }) => {
              return this.cancelERPNextDocs(docs, req, settings);
            }),
            switchMap(success => {
              return this.cancelERPNextDocs(
                { [DOC_NAMES.PURCHASE_INVOICE]: [name] },
                req,
                settings,
              );
            }),
            switchMap(success => {
              return this.purchaseOrderService.findOne({
                purchase_invoice_name: name,
              });
            }),
            switchMap((purchaseOrder: PurchaseOrder) => {
              return forkJoin({
                resetSerials: from(
                  this.serialNoService.deleteMany({
                    purchase_invoice_name: purchaseOrder.purchase_invoice_name,
                  }),
                ),
                resetSerialHistory: from(
                  this.serialHistoryService.deleteMany({
                    parent_document: purchaseOrder.purchase_invoice_name,
                  }),
                ),
                updatePurchaseOrder: from(
                  this.purchaseOrderService.updateOne(
                    { name: purchaseOrder.name },
                    {
                      $set: {
                        docstatus: 2,
                        status: PURCHASE_INVOICE_STATUS.CANCELED,
                      },
                    },
                  ),
                ),
                updatePurchaseInvoice: from(
                  this.purchaseInvoiceService.updateOne(
                    { name },
                    {
                      $set: {
                        docstatus: 2,
                        status: PURCHASE_INVOICE_STATUS.CANCELED,
                      },
                    },
                  ),
                ),
                updatePurchaseReceipt: from(
                  this.purchaseReceiptService.updateMany(
                    {
                      purchase_invoice_name:
                        purchaseOrder.purchase_invoice_name,
                    },
                    {
                      $set: {
                        docstatus: 2,
                        status: PURCHASE_INVOICE_STATUS.CANCELED,
                      },
                    },
                  ),
                ),
              });
            }),
            switchMap(success => of(true)),
          );
      }),
    );
  }

  cancelERPNextDocs(docs: { [key: string]: string[] }, req, settings) {
    return of({}).pipe(
      switchMap(obj => {
        return from(Object.keys(docs)).pipe(
          concatMap((docType: string) => {
            if (!docs[docType]?.length) {
              return of(true);
            }
            return from(docs[docType]).pipe(
              concatMap(doc => {
                return this.cancelDoc(docType, doc, settings, req);
              }),
              switchMap(success => of(true)),
            );
          }),
          catchError(err => {
            if (
              err?.response?.data?.exc &&
              err?.response?.data?.exc.includes(
                'Cannot edit cancelled document',
              )
            ) {
              return of(true);
            }
            return throwError(
              new BadRequestException(err?.response?.data?.exc),
            );
          }),
        );
      }),
      toArray(),
    );
  }

  cancelDoc(doctype, docName, settings: ServerSettings, req) {
    const doc = {
      doctype,
      name: docName,
    };
    return this.http.post(settings.authServerURL + FRAPPE_CLIENT_CANCEL, doc, {
      headers: {
        [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + req.token.accessToken,
      },
    });
  }
}
