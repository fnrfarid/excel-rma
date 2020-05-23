import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map, mergeMap, toArray } from 'rxjs/operators';
import {
  SALES_INVOICE_NOT_FOUND,
  CUSTOMER_AND_CONTACT_INVALID,
  SALES_INVOICE_CANNOT_BE_SUBMITTED,
  DELIVERY_NOTE_IN_QUEUE,
  ITEMS_SHOULD_BE_UNIQUE,
  INVALID_ITEM_TOTAL,
} from '../../../constants/messages';
import { CustomerService } from '../../../customer/entity/customer/customer.service';
import { CreateSalesReturnDto } from '../../entity/sales-invoice/sales-return-dto';
import { ItemDto } from '../../entity/sales-invoice/sales-invoice-dto';
import { AssignSerialNoPoliciesService } from '../../../serial-no/policies/assign-serial-no-policies/assign-serial-no-policies.service';
import {
  DRAFT_STATUS,
  COMPLETED_STATUS,
  TO_DELIVER_STATUS,
  CANCELED_STATUS,
} from '../../../constants/app-strings';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  FRAPPE_API_SALES_INVOICE_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { SerialNoPoliciesService } from '../../../serial-no/policies/serial-no-policies/serial-no-policies.service';

@Injectable()
export class SalesInvoicePoliciesService {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly customerService: CustomerService,
    private readonly assignSerialPolicyService: AssignSerialNoPoliciesService,
    private readonly serialNoPoliciesService: SerialNoPoliciesService,
    private readonly http: HttpService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly settings: SettingsService,
  ) {}

  validateSalesInvoice(uuid: string) {
    return from(this.salesInvoiceService.findOne({ uuid })).pipe(
      switchMap(salesInvoice => {
        if (!salesInvoice) {
          return throwError(new BadRequestException(SALES_INVOICE_NOT_FOUND));
        }
        return of(salesInvoice);
      }),
    );
  }

  validateItems(items: ItemDto[]) {
    const itemSet = new Set();
    items.forEach(item => {
      itemSet.add(item.item_code);
    });
    const item_code: any[] = Array.from(itemSet);
    if (item_code.length !== items.length) {
      return throwError(new BadRequestException(ITEMS_SHOULD_BE_UNIQUE));
    }
    return this.validateItemsTotal(items).pipe(
      switchMap(() => {
        return this.assignSerialPolicyService.validateItem(item_code);
      }),
    );
  }

  validateItemsTotal(items: ItemDto[]) {
    for (let i = 0; i <= items.length - 1; i++) {
      if (items[i].amount !== items[i].qty * items[i].rate) {
        return throwError(
          new BadRequestException(
            this.assignSerialPolicyService.getMessage(
              INVALID_ITEM_TOTAL,
              items[i].qty * items[i].rate,
              items[i].amount,
            ),
          ),
        );
      }
    }
    return of({});
  }
  validateCustomer(salesInvoicePayload: {
    customer: string;
    contact_email: string;
  }) {
    return from(
      this.customerService.findOne({
        name: salesInvoicePayload.customer,
        owner: salesInvoicePayload.contact_email,
      }),
    ).pipe(
      switchMap(customer => {
        if (!customer) {
          return throwError(
            new BadRequestException(CUSTOMER_AND_CONTACT_INVALID),
          );
        }
        return of(true);
      }),
    );
  }
  validateSubmittedState(salesInvoicePayload: { uuid: string }) {
    return from(
      this.salesInvoiceService.findOne({ uuid: salesInvoicePayload.uuid }),
    ).pipe(
      switchMap(salesInvoice => {
        if (salesInvoice.status !== DRAFT_STATUS) {
          return throwError(
            new BadRequestException(
              salesInvoice.status + SALES_INVOICE_CANNOT_BE_SUBMITTED,
            ),
          );
        }
        return of(true);
      }),
    );
  }
  validateQueueState(salesInvoicePayload: { uuid: string }) {
    return from(
      this.salesInvoiceService.findOne({ uuid: salesInvoicePayload.uuid }),
    ).pipe(
      switchMap(queueState => {
        if (queueState.inQueue) {
          return throwError(new BadRequestException(DELIVERY_NOTE_IN_QUEUE));
        }
        return of(queueState);
      }),
    );
  }

  validateSalesReturn(createReturnPayload: CreateSalesReturnDto) {
    const test = createReturnPayload.items;
    const data = new Set();
    test.forEach(element => {
      data.add(element.against_sales_invoice);
    });
    const salesInvoiceName: any[] = Array.from(data);
    if (salesInvoiceName.length === 1) {
      return from(
        this.salesInvoiceService.findOne({ name: salesInvoiceName[0] }),
      ).pipe(
        switchMap(salesInvoice => {
          return of(salesInvoice);
        }),
      );
    }
    return throwError(
      new BadRequestException(
        this.getMessage(SALES_INVOICE_NOT_FOUND, 1, salesInvoiceName.length),
      ),
    );
  }

  validateReturnSerials(payload: CreateSalesReturnDto) {
    return from(payload.items).pipe(
      mergeMap(item => {
        return this.serialNoPoliciesService.validateReturnSerials({
          delivery_note_names: payload.delivery_note_names,
          item_code: item.item_code,
          serials: item.serial_no.split('\n'),
          warehouse: payload.set_warehouse,
        });
      }),
      toArray(),
      switchMap((res: { notFoundSerials: string[] }[]) => {
        const invalidSerials = [];

        res.forEach(invalidSerial => {
          invalidSerials.push(...invalidSerial.notFoundSerials);
        });

        if (invalidSerials.length > 0) {
          return throwError(
            new BadRequestException({
              invalidSerials: invalidSerials.splice(0, 5).join(', '),
            }),
          );
        }
        return of(true);
      }),
    );
  }

  getMessage(notFoundMessage, expected, found) {
    return `${notFoundMessage}, expected ${expected || 0} found ${found || 0}`;
  }

  validateInvoiceStateForCancel(status: string) {
    if (status === TO_DELIVER_STATUS || status === COMPLETED_STATUS) {
      return of(true);
    }
    return throwError(
      new BadRequestException(
        `Cannot cancel sales invoice with status ${status}`,
      ),
    );
  }

  validateInvoiceOnErp(salesInvoicePayload: { uuid: string; name: string }) {
    return forkJoin({
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        return this.http
          .get(
            `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}/${salesInvoicePayload.name}`,
            { headers },
          )
          .pipe(
            map(res => res.data),
            switchMap(async (invoice: { docstatus: number }) => {
              if (invoice.docstatus === 2) {
                await this.salesInvoiceService.updateOne(
                  { uuid: salesInvoicePayload.uuid },
                  {
                    $set: {
                      status: CANCELED_STATUS,
                      inQueue: false,
                      isSynced: true,
                    },
                  },
                );
                return throwError(
                  new BadRequestException('Invoice already Cancelled'),
                );
              }
              return of(true);
            }),
          );
      }),
    );
  }

  getDeliveryNotes(sales_invoice_name: string) {
    return forkJoin({
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        const params = {
          filters: JSON.stringify([
            ['against_sales_invoice', '=', sales_invoice_name],
            ['docstatus', '!=', 2],
          ]),
        };
        return this.http
          .get(`${settings.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`, {
            params,
            headers,
          })
          .pipe(
            map(res => res.data.data),
            switchMap((deliveryNotes: any[]) => {
              return of(deliveryNotes.map(delivery_note => delivery_note.name));
            }),
          );
      }),
    );
  }

  getSalesInvoices(sales_invoice_name: string) {
    return forkJoin({
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        const params = {
          filters: JSON.stringify([
            ['return_against', '=', sales_invoice_name],
            ['docstatus', '!=', 2],
          ]),
        };
        return this.http
          .get(
            `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}`,
            {
              params,
              headers,
            },
          )
          .pipe(
            map(res => res.data.data),
            switchMap((salesInvoices: any[]) => {
              if (salesInvoices.length !== 0)
                return of(
                  salesInvoices.map(sales_invoice => sales_invoice.name),
                );
              return of([]);
            }),
          );
      }),
    );
  }
}
