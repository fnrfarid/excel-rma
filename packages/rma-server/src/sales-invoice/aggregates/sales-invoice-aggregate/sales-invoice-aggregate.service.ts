import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SalesInvoiceDto } from '../../entity/sales-invoice/sales-invoice-dto';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceAddedEvent } from '../../event/sales-invoice-added/sales-invoice-added.event';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoiceRemovedEvent } from '../../event/sales-invoice-removed/sales-invoice-removed.event';
import { SalesInvoiceUpdatedEvent } from '../../event/sales-invoice-updated/sales-invoice-updated.event';

@Injectable()
export class SalesInvoiceAggregateService extends AggregateRoot {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {
    super();
  }

  addSalesInvoice(salesInvoicePayload: SalesInvoiceDto, clientHttpRequest) {
    const salesInvoice = new SalesInvoice();
    Object.assign(salesInvoice, salesInvoicePayload);
    salesInvoice.uuid = uuidv4();
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

  async update(updatePayload: SalesInvoice) {
    const provider = await this.salesInvoiceService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    this.apply(new SalesInvoiceUpdatedEvent(updatePayload));
  }
}
