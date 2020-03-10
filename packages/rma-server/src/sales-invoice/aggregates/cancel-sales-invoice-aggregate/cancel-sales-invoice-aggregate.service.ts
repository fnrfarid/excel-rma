import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import {
  switchMap,
  concatMap,
  mergeMap,
  map,
  catchError,
  retry,
  toArray,
} from 'rxjs/operators';
import { forkJoin, of, throwError, from } from 'rxjs';
import { SalesInvoiceCanceledEvent } from '../../event/sales-invoice-canceled/sales-invoice-canceled.event';
import { SalesInvoicePoliciesService } from '../../policies/sales-invoice-policies/sales-invoice-policies.service';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { FRAPPE_CLIENT_CANCEL } from '../../../constants/routes';
import {
  APPLICATION_JSON_CONTENT_TYPE,
  ACCEPT,
  CONTENT_TYPE,
} from '../../../constants/app-strings';

@Injectable()
export class CancelSalesInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly validateSalesInvoicePolicy: SalesInvoicePoliciesService,
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly errorLogService: ErrorLogService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  cancelSalesInvoice(uuid: string, clientHttpRequest: any) {
    return this.validateSalesInvoicePolicy.validateSalesInvoice(uuid).pipe(
      switchMap(salesInvoice => {
        return forkJoin({
          queueState: this.validateSalesInvoicePolicy.validateQueueState(
            salesInvoice,
          ),
          invoiceState: this.validateSalesInvoicePolicy.validateInvoiceStateForCancel(
            salesInvoice.status,
          ),
          invoiceOnErp: this.validateSalesInvoicePolicy.validateInvoiceOnErp(
            salesInvoice,
          ),
          deliveryNoteNames: this.validateSalesInvoicePolicy.getDeliveryNotes(
            salesInvoice.name,
          ),
          returnInvoiceNames: this.validateSalesInvoicePolicy.getSalesInvoices(
            salesInvoice.name,
          ),
        }).pipe(
          switchMap(({ deliveryNoteNames, returnInvoiceNames }) => {
            this.apply(new SalesInvoiceCanceledEvent(salesInvoice));
            this.syncCancelSalesInvoice(
              deliveryNoteNames,
              returnInvoiceNames,
              salesInvoice,
              clientHttpRequest,
            );
            return of({});
          }),
        );
      }),
    );
  }

  syncCancelSalesInvoice(
    deliveryNoteNames: string[],
    returnInvoicesNames: string[],
    salesInvoice: SalesInvoice,
    clientHttpRequest: any,
  ) {
    const docs = this.mapDoctypesToCancel(
      deliveryNoteNames,
      returnInvoicesNames,
      salesInvoice.name,
    );

    this.cancelAllDoctypesFromErp(docs).subscribe({
      next: res => {
        this.salesInvoiceService
          .updateOne(
            { uuid: salesInvoice.uuid },
            {
              $set: {
                inQueue: false,
                isSynced: true,
              },
            },
          )
          .then(() => {})
          .catch(() => {});
      },
      error: err => {
        this.salesInvoiceService
          .updateOne(
            { uuid: salesInvoice.uuid },
            {
              $set: {
                inQueue: false,
                isSynced: false,
              },
            },
          )
          .then(() => {})
          .catch(() => {});
        this.errorLogService.createErrorLog(
          err,
          'Sales Invoice',
          'salesInvoice',
          clientHttpRequest,
        );
      },
    });
  }

  cancelAllDoctypesFromErp(docs: any[]) {
    return forkJoin({
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settingsService.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        if (!settings || !settings.authServerURL)
          return throwError(new NotImplementedException());
        return from(docs).pipe(
          concatMap(doc => {
            return of({}).pipe(
              mergeMap(() => {
                const url = `${settings.authServerURL}${FRAPPE_CLIENT_CANCEL}`;
                const body = doc;
                headers[CONTENT_TYPE] = APPLICATION_JSON_CONTENT_TYPE;
                headers[ACCEPT] = APPLICATION_JSON_CONTENT_TYPE;
                return this.http
                  .post(url, JSON.stringify(body), {
                    headers,
                  })
                  .pipe(map(data => data.data.data));
              }),
              catchError(err => {
                return throwError(new BadRequestException(err));
              }),
              retry(3),
            );
          }),
          toArray(),
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

  mapDoctypesToCancel(
    deliveryNoteNames: string[],
    returnInvoicesNames: string[],
    sales_invoice_name: string,
  ) {
    const docs = [];
    deliveryNoteNames.forEach(delivery_note => {
      docs.push({ doctype: 'Delivery Note', name: delivery_note });
    });
    returnInvoicesNames.forEach(return_invoice => {
      docs.push({ doctype: 'Sales Invoice', name: return_invoice });
    });
    docs.push({ doctype: 'Sales Invoice', name: sales_invoice_name });
    return docs;
  }
}
