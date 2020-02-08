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

  async list(skip, take, sort, filter_query?) {
    let sortQuery;

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = { posting_date: 'desc' };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    const $and: any[] = [filter_query ? this.getFilterQuery(filter_query) : {}];

    const where: { $and: any } = { $and };

    const results = await this.purchaseInvoiceRepository.find({
      skip,
      take,
      where,
      order: sortQuery,
    });

    return {
      docs: results || [],
      length: await this.purchaseInvoiceRepository.count(where),
      offset: skip,
    };
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        if (key === 'status' && query[key] === 'All') {
          delete query[key];
        } else {
          query[key] = new RegExp(query[key], 'i');
        }
      } else {
        delete query[key];
      }
    });
    return query;
  }

  async deleteOne(query, options?) {
    return await this.purchaseInvoiceRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.purchaseInvoiceRepository.updateOne(query, options);
  }
}
