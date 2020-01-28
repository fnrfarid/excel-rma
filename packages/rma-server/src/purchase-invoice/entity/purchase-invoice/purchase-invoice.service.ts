import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: MongoRepository<
      PurchaseInvoice
    >,
  ) {}

  async find(query?) {
    return await this.purchaseInvoiceRepository.find(query);
  }

  async create(purchaseInvoice: PurchaseInvoice) {
    const purchaseInvoiceObject = new PurchaseInvoice();
    Object.assign(purchaseInvoiceObject, purchaseInvoice);
    return await this.purchaseInvoiceRepository.insertOne(
      purchaseInvoiceObject,
    );
  }

  async findOne(param, options?) {
    return await this.purchaseInvoiceRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.purchaseInvoiceRepository.manager.connection
      .getMetadata(PurchaseInvoice)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.purchaseInvoiceRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.purchaseInvoiceRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.purchaseInvoiceRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.purchaseInvoiceRepository.updateOne(query, options);
  }
}
