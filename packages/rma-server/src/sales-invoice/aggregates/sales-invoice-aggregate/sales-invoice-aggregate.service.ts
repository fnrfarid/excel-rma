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
import {
  SUBMITTED_SALES_INVOICE_CANNOT_BE_UPDATED,
  DELIVERY_NOTE_ALREADY_SUBMITTED,
  DELIVERY_NOTE_IN_QUEUE,
} from '../../../constants/messages';
import { SalesInvoiceSubmittedEvent } from '../../event/sales-invoice-submitted/sales-invoice-submitted.event';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FRAPPE_API_SERIAL_NO_ENDPOINT } from '../../../constants/routes';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
} from '../../../constants/app-strings';
import { ACCEPT } from '../../../constants/app-strings';

@Injectable()
export class SalesInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
  ) {
    super();
  }

  addSalesInvoice(salesInvoicePayload: SalesInvoiceDto, clientHttpRequest) {
    const salesInvoice = new SalesInvoice();
    Object.assign(salesInvoice, salesInvoicePayload);
    salesInvoice.uuid = uuidv4();
    salesInvoice.isSynced = false;
    salesInvoice.inQueue = false;
    this.apply(new SalesInvoiceAddedEvent(salesInvoice, clientHttpRequest));
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

  async submitSalesInvoice(uuid, clientHttpRequest: any) {
    const provider = await this.salesInvoiceService.findOne({ uuid });
    if (!provider) {
      throw new NotFoundException();
    }
    if (provider.submitted === true) {
      throw new BadRequestException(DELIVERY_NOTE_ALREADY_SUBMITTED);
    }
    if (provider.inQueue === true) {
      throw new BadRequestException(DELIVERY_NOTE_IN_QUEUE);
    }
    this.apply(new SalesInvoiceSubmittedEvent(provider));
    this.syncSubmittedSalesInvoice(provider, clientHttpRequest);
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
            settings.authServerURL + FRAPPE_API_SERIAL_NO_ENDPOINT,
            body,
            {
              headers: {
                [AUTHORIZATION]:
                  BEARER_HEADER_VALUE_PREFIX +
                  clientHttpRequest.token.accessToken,
                [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
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
              { $set: { inQueue: false } },
            )
            .then(updated => {})
            .catch(error => {});
        },
      });
  }

  mapSalesInvoice(salesInvoice: SalesInvoice) {
    const data = {
      title: salesInvoice.title,
      customer: salesInvoice.customer,
      company: salesInvoice.company,
      posting_date: salesInvoice.posting_date,
      set_posting_time: salesInvoice.set_posting_time,
      due_date: salesInvoice.due_date,
      address_display: salesInvoice.address_display,
      contact_person: salesInvoice.contact_person,
      contact_display: salesInvoice.contact_display,
      contact_email: salesInvoice.contact_email,
      territory: salesInvoice.territory,
      update_stock: salesInvoice.update_stock,
      total_qty: salesInvoice.total_qty,
      base_total: salesInvoice.base_total,
      base_net_total: salesInvoice.base_net_total,
      total: salesInvoice.total,
      net_total: salesInvoice.net_total,
      pos_total_qty: salesInvoice.pos_total_qty,
      items: salesInvoice.items.filter(each => {
        delete each.owner;
        return each;
      }),
      pricing_rules: salesInvoice.pricing_rules,
      packed_items: salesInvoice.packed_items,
      timesheets: salesInvoice.timesheets,
      taxes: salesInvoice,
      advances: salesInvoice.advances,
      payment_schedule: salesInvoice.payment_schedule,
      payments: salesInvoice.payments,
      sales_team: salesInvoice.sales_team,
    };
    return data;
  }
}
