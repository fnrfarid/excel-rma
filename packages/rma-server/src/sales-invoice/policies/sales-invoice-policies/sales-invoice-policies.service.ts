import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
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
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CANCELED_STATUS,
} from '../../../constants/app-strings';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  FRAPPE_API_SALES_INVOICE_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { SalesInvoice } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.entity';

@Injectable()
export class SalesInvoicePoliciesService {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly customerService: CustomerService,
    private readonly assignSerialPolicyService: AssignSerialNoPoliciesService,
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
      token: this.clientToken.getClientToken(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ token, settings }) => {
        return this.http
          .get(
            `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}/${salesInvoicePayload.name}`,
            {
              headers: {
                [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
              },
            },
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

  getCanceledDeliveryNotes(salesInvoicePayload: SalesInvoice) {
    return forkJoin({
      token: this.clientToken.getClientToken(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ token, settings }) => {
        const deliveryNoteNames = [
          ...new Set(
            salesInvoicePayload.delivery_note_items.map(
              item => item.delivery_note,
            ),
          ),
        ];
        const params = {
          filters: JSON.stringify([
            ['name', 'in', deliveryNoteNames],
            ['docstatus', '=', 2],
          ]),
        };
        return this.http
          .get(`${settings.authServerURL}${POST_DELIVERY_NOTE_ENDPOINT}`, {
            params,
            headers: {
              [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
            },
          })
          .pipe(
            map(res => res.data.data),
            switchMap((deliveryNotes: any[]) => {
              const DNNameMap = {};
              deliveryNoteNames.forEach(DN => {
                DNNameMap[DN] = true;
              });
              deliveryNotes.forEach(delivery_note => {
                delete DNNameMap[delivery_note.name];
              });
              return of(Object.keys(DNNameMap));
            }),
          );
      }),
    );
  }
}
