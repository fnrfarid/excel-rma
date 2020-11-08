import { HttpService, Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { PurchaseOrderPoliciesService } from '../../policies/purchase-order-policies/purchase-order-policies.service';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';
import { switchMap } from 'rxjs/operators';
import { forkJoin, from, of } from 'rxjs';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseOrder } from '../../entity/purchase-order/purchase-order.entity';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import {
  DOC_NAMES,
  DOC_RESET_INFO,
  PURCHASE_INVOICE_STATUS,
} from '../../../constants/app-strings';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ERPNEXT_CANCEL_ALL_DOCS_ENDPOINT } from '../../../constants/routes';

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
    return this.purchaseOrderPolicy.validatePurchaseOrderReset(name).pipe(
      switchMap(valid => {
        return from(
          this.purchaseOrderService.findOne({ purchase_invoice_name: name }),
        );
      }),
      switchMap(purchaseOrder => {
        return this.cancelERPNextDocs(purchaseOrder, req);
      }),
      switchMap((purchaseOrder: PurchaseOrder) => {
        return forkJoin({
          resetSerials: from(
            this.serialNoService.deleteMany({
              purchase_invoice_name: purchaseOrder.purchase_invoice_name,
            }),
          ),
          resetSerialHistory: this.serialHistoryService.deleteMany({
            parent_document: purchaseOrder.purchase_invoice_name,
          }),
        });
      }),
      switchMap(success => {
        return from(
          this.purchaseInvoiceService.updateOne({
            name,
            $set: {
              status: PURCHASE_INVOICE_STATUS.RESETED,
            },
          }),
        );
      }),
    );
  }

  cancelERPNextDocs(purchaseOrder: PurchaseOrder, req) {
    return this.serverSettings.find().pipe(
      switchMap(settings => {
        return this.http.post(
          settings.authServerURL + ERPNEXT_CANCEL_ALL_DOCS_ENDPOINT,
          {
            doctype: DOC_NAMES.PURCHASE_ORDER,
            name: purchaseOrder.name,
            linkinfo: DOC_RESET_INFO[DOC_NAMES.PURCHASE_ORDER],
          },
          { headers: this.serverSettings.getAuthorizationHeaders(req.token) },
        );
      }),
      switchMap(success => {
        return of(purchaseOrder);
      }),
    );
  }
}
