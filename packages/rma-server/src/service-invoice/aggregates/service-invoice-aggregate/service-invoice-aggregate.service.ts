import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  HttpService,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { ServiceInvoiceDto } from '../../entity/service-invoice/service-invoice-dto';
import { ServiceInvoice } from '../../entity/service-invoice/service-invoice.entity';
import { ServiceInvoiceService } from '../../entity/service-invoice/service-invoice.service';
import { ServiceInvoiceRemovedEvent } from '../../event/service-invoice-removed/service-invoice-removed.event';
import { ServiceInvoiceUpdatedEvent } from '../../event/service-invoice-updated/service-invoice-updated.event';
import { UpdateServiceInvoiceDto } from '../../entity/service-invoice/update-service-invoice-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap, map } from 'rxjs/operators';
import { throwError, of, from } from 'rxjs';
import { FRAPPE_API_SALES_INVOICE_ENDPOINT } from '../../../constants/routes';
import {
  CONTENT_TYPE,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
  BEARER_HEADER_VALUE_PREFIX,
  AUTHORIZATION,
} from '../../../constants/app-strings';

@Injectable()
export class ServiceInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly serviceInvoiceService: ServiceInvoiceService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
  ) {
    super();
  }

  assignServiceInvoiceFields(
    serviceInvoicePayload: ServiceInvoiceDto,
    clientHttpRequest,
  ) {
    const serviceInvoice = new ServiceInvoice();
    Object.assign(serviceInvoice, serviceInvoicePayload);
    serviceInvoice.uuid = uuidv4();
    serviceInvoice.created_by = clientHttpRequest.token.fullName;
    serviceInvoice.invoice_no = serviceInvoicePayload.name;
    return of(serviceInvoice);
  }

  addServiceInvoice(serviceInvoice: ServiceInvoiceDto, clientHttpRequest) {
    return this.settings
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings) {
            return throwError(new NotImplementedException());
          }
          const URL = `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}`;
          const body = this.mapValues(serviceInvoice);
          return this.http.post(URL, JSON.stringify(body), {
            headers: {
              [AUTHORIZATION]:
                BEARER_HEADER_VALUE_PREFIX +
                clientHttpRequest.token.accessToken,
              [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
              [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
            },
          });
        }),
      )
      .pipe(map(data => data.data.data))
      .pipe(
        switchMap(res => {
          Object.assign(res, serviceInvoice);
          return this.assignServiceInvoiceFields(res, clientHttpRequest);
        }),
        switchMap(data => {
          return from(this.serviceInvoiceService.create(data));
        }),
      );
  }

  mapValues(serviceInvoicePayload: ServiceInvoiceDto) {
    const serviceInvoice = {} as ServiceInvoiceDto;
    serviceInvoice.customer = serviceInvoicePayload.customer;
    serviceInvoice.customer_contact = serviceInvoicePayload.customer_contact;
    serviceInvoice.total_qty = serviceInvoicePayload.total_qty;
    serviceInvoice.total = serviceInvoicePayload.total;
    serviceInvoice.status = serviceInvoicePayload.status;
    serviceInvoice.contact_email = serviceInvoicePayload.contact_email;
    serviceInvoice.due_date = serviceInvoicePayload.due_date;
    serviceInvoice.remarks = serviceInvoicePayload.remarks;
    serviceInvoice.delivery_warehouse =
      serviceInvoicePayload.delivery_warehouse;
    serviceInvoice.items = serviceInvoicePayload.items;
    return serviceInvoice;
  }

  async retrieveServiceInvoice(uuid: string, req) {
    const provider = await this.serviceInvoiceService.findOne({ uuid });
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getServiceInvoiceList(offset, limit, sort, search, clientHttpRequest) {
    return await this.serviceInvoiceService.list(offset, limit, search, sort);
  }

  async remove(uuid: string) {
    const found = await this.serviceInvoiceService.findOne({ uuid });
    if (!found) {
      throw new NotFoundException();
    }
    this.apply(new ServiceInvoiceRemovedEvent(found));
  }

  async update(updatePayload: UpdateServiceInvoiceDto) {
    const provider = await this.serviceInvoiceService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    const update = Object.assign(provider, updatePayload);
    this.apply(new ServiceInvoiceUpdatedEvent(update));
  }
}
