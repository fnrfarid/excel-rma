import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { ServiceInvoiceDto } from '../../entity/service-invoice/service-invoice-dto';
import { ServiceInvoice } from '../../entity/service-invoice/service-invoice.entity';
import { ServiceInvoiceAddedEvent } from '../../event/service-invoice-added/service-invoice-added.event';
import { ServiceInvoiceService } from '../../entity/service-invoice/service-invoice.service';
import { ServiceInvoiceRemovedEvent } from '../../event/service-invoice-removed/service-invoice-removed.event';
import { ServiceInvoiceUpdatedEvent } from '../../event/service-invoice-updated/service-invoice-updated.event';
import { UpdateServiceInvoiceDto } from '../../entity/service-invoice/update-service-invoice-dto';

@Injectable()
export class ServiceInvoiceAggregateService extends AggregateRoot {
  constructor(private readonly serviceInvoiceService: ServiceInvoiceService) {
    super();
  }

  addServiceInvoice(
    serviceInvoicePayload: ServiceInvoiceDto,
    clientHttpRequest,
  ) {
    const serviceInvoice = new ServiceInvoice();
    Object.assign(serviceInvoice, serviceInvoicePayload);
    serviceInvoice.uuid = uuidv4();
    this.apply(new ServiceInvoiceAddedEvent(serviceInvoice, clientHttpRequest));
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
