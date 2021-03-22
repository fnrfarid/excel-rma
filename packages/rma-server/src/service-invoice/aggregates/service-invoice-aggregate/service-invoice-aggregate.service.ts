import {
  Injectable,
  NotFoundException,
  HttpService,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { ServiceInvoiceDto } from '../../entity/service-invoice/service-invoice-dto';
import { ServiceInvoice } from '../../entity/service-invoice/service-invoice.entity';
import { ServiceInvoiceService } from '../../entity/service-invoice/service-invoice.service';
import { ServiceInvoiceRemovedEvent } from '../../event/service-invoice-removed/service-invoice-removed.event';
import { ServiceInvoiceUpdatedEvent } from '../../event/service-invoice-updated/service-invoice-updated.event';
import { UpdateServiceInvoiceDto } from '../../entity/service-invoice/update-service-invoice-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { throwError, of, from } from 'rxjs';
import { FRAPPE_API_SALES_INVOICE_ENDPOINT } from '../../../constants/routes';
import {
  CONTENT_TYPE,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
  BEARER_HEADER_VALUE_PREFIX,
  AUTHORIZATION,
  DEFAULT_NAMING_SERIES,
} from '../../../constants/app-strings';
import { WarrantyClaimService } from '../../../warranty-claim/entity/warranty-claim/warranty-claim.service';

@Injectable()
export class ServiceInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly serviceInvoiceService: ServiceInvoiceService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
    private readonly warrantyAggregateService: WarrantyClaimService,
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
    return this.settings.find().pipe(
      switchMap(settings => {
        const URL = `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}`;
        serviceInvoice.naming_series = DEFAULT_NAMING_SERIES.service_invoice;
        const body = serviceInvoice;
        return this.http.post(URL, JSON.stringify(body), {
          headers: {
            [AUTHORIZATION]:
              BEARER_HEADER_VALUE_PREFIX + clientHttpRequest.token.accessToken,
            [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
            [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
          },
        });
      }),
      map(data => data.data.data),
      switchMap((res: ServiceInvoiceDto) => {
        Object.assign(res, serviceInvoice);
        return this.assignServiceInvoiceFields(res, clientHttpRequest);
      }),
      switchMap(data => {
        return from(this.serviceInvoiceService.create(data));
      }),
      switchMap(() => {
        return this.serviceInvoiceService.asyncAggregate([
          { $match: { warrantyClaimUuid: serviceInvoice.warrantyClaimUuid } },
          { $unwind: '$items' },
          {
            $project: {
              invoice_no: 1,
              total: 1,
              item_name: '$items.item_name',
            },
          },
          {
            $group: {
              _id: '',
              service_items: { $push: '$item_name' },
              service_invoices: { $push: '$invoice_no' },
              total: { $sum: '$total' },
            },
          },
          {
            $project: {
              service_items: '$service_items',
              service_invoices: '$service_invoices',
              total: '$total',
            },
          },
        ]);
      }),
      switchMap((res: any) => {
        return this.warrantyAggregateService.updateOne(
          { uuid: serviceInvoice.warrantyClaimUuid },
          {
            $set: {
              service_items: res[0].service_items,
              service_vouchers: res[0].service_invoices,
              billed_amount: res[0].total,
            },
          },
        );
      }),
      catchError(err => {
        return throwError(new BadRequestException(err));
      }),
    );
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
