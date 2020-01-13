import { Injectable, BadRequestException } from '@nestjs/common';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  SALES_INVOICE_NOT_FOUND,
  CUSTOMER_AND_CONTACT_INVALID,
  DELIVERY_NOTE_ALREADY_SUBMITTED,
  DELIVERY_NOTE_IN_QUEUE,
} from '../../../constants/messages';
import { CustomerService } from '../../../customer/entity/customer/customer.service';

@Injectable()
export class SalesInvoicePoliciesService {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly customerService: CustomerService,
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
      switchMap(submittedState => {
        if (submittedState.submitted) {
          return throwError(
            new BadRequestException(DELIVERY_NOTE_ALREADY_SUBMITTED),
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
}
