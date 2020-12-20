import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { throwError, from, of, forkJoin, Observable } from 'rxjs';
import { SalesInvoiceResetPoliciesService } from '../../policies/sales-invoice-reset-policies/sales-invoice-reset-policies.service';
import {
  FRAPPE_CLIENT_CANCEL,
  GET_FRAPPE_LINKED_DOCS_ENDPOINT,
} from '../../../constants/routes';
import {
  DOC_NAMES,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  DOC_RESET_INFO,
  SALES_INVOICE_STATUS,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { DocInfoInterface } from '../../../purchase-order/policies/purchase-order-policies/purchase-order-policies.service';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

@Injectable()
export class SalesInvoiceResetAggregateService extends AggregateRoot {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
    private readonly salesResetPolicies: SalesInvoiceResetPoliciesService,
    private readonly serialNoService: SerialNoService,
  ) {
    super();
  }

  cancel(uuid: string, req) {
    let serverSettings;
    return from(this.salesInvoiceService.findOne({ uuid })).pipe(
      switchMap(salesInvoice => {
        if (!salesInvoice) {
          return throwError(new BadRequestException('Sales Invoice not found'));
        }
        return this.salesResetPolicies.validateSalesInvoiceReset(salesInvoice);
      }),
      switchMap(salesInvoice => {
        return this.settingsService.find().pipe(
          switchMap(settings => {
            serverSettings = settings;
            return this.cancelERPNextSalesInvoice(salesInvoice, settings, req);
          }),
          switchMap(success => {
            return this.cancelERPNextDocs(
              { [DOC_NAMES.SALES_INVOICE]: [salesInvoice.name] },
              req,
              serverSettings,
            );
          }),
          switchMap(success => of(salesInvoice)),
        );
      }),
      switchMap(salesInvoice => {
        const returned_serials = [];
        salesInvoice.returned_items?.forEach(item =>
          item.serial_no
            ? returned_serials.push(item.serial_no.split('\n'))
            : null,
        );
        return forkJoin({
          resetSerialHistory: from(
            this.serialNoHistoryService.deleteMany({
              parent_document: salesInvoice.name,
            }),
          ),
          resetSerialState: from(
            this.serialNoService.updateMany(
              {
                $or: [
                  { serial_no: { $in: returned_serials } },
                  { sales_invoice_name: salesInvoice.name },
                ],
              },
              {
                $unset: {
                  customer: undefined,
                  'warranty.salesWarrantyDate': undefined,
                  'warranty.soldOn': undefined,
                  delivery_note: undefined,
                  sales_invoice_name: undefined,
                  sales_return_name: undefined,
                },
              },
            ),
          ),
        }).pipe(switchMap(success => of(salesInvoice)));
      }),
      switchMap(salesInvoice => {
        return from(
          this.salesInvoiceService.updateOne(
            { name: salesInvoice.name },
            {
              $set: {
                docstatus: 2,
                status: SALES_INVOICE_STATUS.canceled,
              },
            },
          ),
        );
      }),
    );
  }

  cancelERPNextSalesInvoice(salesInvoice: SalesInvoice, settings, req) {
    return this.getERPNextLinkedDocs(
      DOC_NAMES.SALES_INVOICE,
      salesInvoice.name,
      DOC_RESET_INFO[DOC_NAMES.SALES_INVOICE],
      settings,
      req,
    ).pipe(
      switchMap(docs => {
        return of({
          [DOC_NAMES.SALES_INVOICE]: docs.message[DOC_NAMES.SALES_INVOICE]
            ? docs.message[DOC_NAMES.SALES_INVOICE]
                .filter(data => data.docstatus !== 2)
                .map(data => data.name)
            : [],
          [DOC_NAMES.DELIVERY_NOTE]: docs.message[DOC_NAMES.DELIVERY_NOTE]
            ? docs.message[DOC_NAMES.DELIVERY_NOTE]
                .filter(data => data.docstatus !== 2)
                .map(data => data.name)
            : [],
        });
      }),
      switchMap(data => {
        return this.cancelERPNextDocs(data, req, settings);
      }),
    );
  }

  cancelERPNextDocs(docs: { [key: string]: string[] }, req, settings) {
    return of({}).pipe(
      switchMap(obj => {
        return from(Object.keys(docs)).pipe(
          concatMap((docType: string) => {
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
            return throwError(err);
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

  getERPNextLinkedDocs(
    docTypeName,
    docName,
    docInfo,
    settings: ServerSettings,
    clienthttpReq,
  ): Observable<{ message: { [key: string]: DocInfoInterface[] } }> {
    return this.http
      .post(
        settings.authServerURL + GET_FRAPPE_LINKED_DOCS_ENDPOINT,
        {
          doctype: docTypeName,
          name: docName,
          linkinfo: docInfo,
        },
        {
          headers: {
            [AUTHORIZATION]:
              BEARER_HEADER_VALUE_PREFIX + clienthttpReq.token.accessToken,
          },
        },
      )
      .pipe(map(data => data.data));
  }
}
