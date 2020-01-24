import { Injectable, BadRequestException } from '@nestjs/common';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
import { DRAFT_STATUS } from '../../../constants/app-strings';

@Injectable()
export class SalesInvoicePoliciesService {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly customerService: CustomerService,
    private readonly assignSerialPolicyService: AssignSerialNoPoliciesService,
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
        this.salesInvoiceService.findOne({ name: salesInvoiceName }),
      ).pipe(
        switchMap(salesInvoice => {
          return salesInvoiceName;
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
}
