import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  HttpService,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SalesInvoiceDto } from '../../entity/sales-invoice/sales-invoice-dto';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceAddedEvent } from '../../event/sales-invoice-added/sales-invoice-added.event';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoiceRemovedEvent } from '../../event/sales-invoice-removed/sales-invoice-removed.event';
import { SalesInvoiceUpdatedEvent } from '../../event/sales-invoice-updated/sales-invoice-updated.event';
import { SalesInvoiceUpdateDto } from '../../entity/sales-invoice/sales-invoice-update-dto';
import { SUBMITTED_SALES_INVOICE_CANNOT_BE_UPDATED } from '../../../constants/messages';
import { SalesInvoiceSubmittedEvent } from '../../event/sales-invoice-submitted/sales-invoice-submitted.event';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
} from '../../../constants/app-strings';
import { ACCEPT } from '../../../constants/app-strings';
import { APP_WWW_FORM_URLENCODED } from '../../../constants/app-strings';
import { FRAPPE_API_SALES_INVOICE_ENDPOINT } from '../../../constants/routes';
import { SalesInvoicePoliciesService } from '../../../sales-invoice/policies/sales-invoice-policies/sales-invoice-policies.service';

@Injectable()
export class SalesInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly validateSalesInvoicePolicy: SalesInvoicePoliciesService,
  ) {
    super();
  }

  addSalesInvoice(salesInvoicePayload: SalesInvoiceDto, clientHttpRequest) {
    return this.validateSalesInvoicePolicy
      .validateCustomer(salesInvoicePayload)
      .pipe(
        switchMap(() => {
          const salesInvoice = new SalesInvoice();
          Object.assign(salesInvoice, salesInvoicePayload);
          salesInvoice.uuid = uuidv4();
          salesInvoice.isSynced = false;
          salesInvoice.inQueue = false;
          this.apply(
            new SalesInvoiceAddedEvent(salesInvoice, clientHttpRequest),
          );
          return of({});
        }),
      );
  }

  async retrieveSalesInvoice(uuid: string, req) {
    const provider = await this.salesInvoiceService.findOne({ uuid });
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getSalesInvoiceList(offset, limit, search, sort) {
    return this.salesInvoiceService.list(offset, limit, search, sort);
  }

  async remove(uuid: string) {
    const found = await this.salesInvoiceService.findOne({ uuid });
    if (!found) {
      throw new NotFoundException();
    }
    this.apply(new SalesInvoiceRemovedEvent(found));
  }

  async update(updatePayload: SalesInvoiceUpdateDto) {
    const provider = await this.salesInvoiceService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    if (provider.submitted === true) {
      throw new BadRequestException(SUBMITTED_SALES_INVOICE_CANNOT_BE_UPDATED);
    }
    this.apply(new SalesInvoiceUpdatedEvent(updatePayload));
  }

  submitSalesInvoice(uuid: string, clientHttpRequest: any) {
    return this.validateSalesInvoicePolicy.validateSalesInvoice(uuid).pipe(
      switchMap(salesInvoice => {
        return this.validateSalesInvoicePolicy
          .validateCustomer(salesInvoice)
          .pipe(
            switchMap(() => {
              return this.validateSalesInvoicePolicy
                .validateSubmittedState(salesInvoice)
                .pipe(
                  switchMap(() => {
                    return this.validateSalesInvoicePolicy.validateQueueState(
                      salesInvoice,
                    );
                  }),
                )
                .pipe(
                  switchMap(isValid => {
                    this.apply(new SalesInvoiceSubmittedEvent(salesInvoice));
                    this.syncSubmittedSalesInvoice(
                      salesInvoice,
                      clientHttpRequest,
                    );
                    return of({});
                  }),
                );
            }),
          );
      }),
    );
  }

  syncSubmittedSalesInvoice(
    salesInvoice: SalesInvoice,
    clientHttpRequest: any,
  ) {
    return this.settingsService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings || !settings.authServerURL) {
            this.salesInvoiceService
              .updateOne(
                { uuid: salesInvoice.uuid },
                { $set: { inQueue: false } },
              )
              .then(success => {})
              .catch(error => {});
            return throwError(new NotImplementedException());
          }
          const body = this.mapSalesInvoice(salesInvoice);

          return this.http.post(
            settings.authServerURL + FRAPPE_API_SALES_INVOICE_ENDPOINT,
            body,
            {
              headers: {
                [AUTHORIZATION]:
                  BEARER_HEADER_VALUE_PREFIX +
                  clientHttpRequest.token.accessToken,
                [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
                [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
              },
            },
          );
        }),
      )
      .subscribe({
        next: success => {
          this.salesInvoiceService
            .updateOne(
              { uuid: salesInvoice.uuid },
              { $set: { inQueue: false, isSynced: true, submitted: true } },
            )
            .then(updated => {})
            .catch(error => {});
        },
        error: err => {
          this.salesInvoiceService
            .updateOne(
              { uuid: salesInvoice.uuid },
              { $set: { inQueue: false, isSynced: false, submitted: false } },
            )
            .then(updated => {})
            .catch(error => {});
        },
      });
  }

  mapSalesInvoice(salesInvoice: SalesInvoice) {
    return {
      // title: salesInvoice.title ,
      docstatus: 1,
      customer: salesInvoice.customer,
      company: salesInvoice.company,
      posting_date: salesInvoice.posting_date,
      set_posting_time: salesInvoice.set_posting_time,
      due_date: salesInvoice.due_date,
      contact_email: salesInvoice.contact_email,
      territory: salesInvoice.territory,
      total_qty: salesInvoice.total_qty,
      update_stock: salesInvoice.update_stock,
      total: salesInvoice.total,
      items: salesInvoice.items.filter(each => {
        delete each.owner;
        return each;
      }),
      timesheets: salesInvoice.timesheets,
      taxes: salesInvoice.taxes,
      payment_schedule: salesInvoice.payment_schedule,
      payments: salesInvoice.payments,
      sales_team: salesInvoice.sales_team,
    };
  }
}
