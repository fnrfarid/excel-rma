import { InjectRepository } from '@nestjs/typeorm';
import { SalesInvoice } from './sales-invoice.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class SalesInvoiceService {
  constructor(
    @InjectRepository(SalesInvoice)
    private readonly salesInvoiceRepository: MongoRepository<SalesInvoice>,
  ) {}

  async find() {
    return await this.salesInvoiceRepository.find();
  }

  async create(salesInvoice: SalesInvoice) {
    return await this.salesInvoiceRepository.insertOne(salesInvoice);
  }

  async findOne(query, param?) {
    return await this.salesInvoiceRepository.findOne(query, param);
  }

  async list(skip, take, sort, filter_query?) {
    const $and: any[] = [filter_query ? this.getFilterQuery(filter_query) : {}];

    const where: { $and: any } = { $and };

    const results = await this.salesInvoiceRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.salesInvoiceRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, param?) {
    return await this.salesInvoiceRepository.deleteOne(query, param);
  }

  async updateOne(query, param) {
    return await this.salesInvoiceRepository.updateOne(query, param);
  }

  async updateMany(query, options?) {
    return await this.salesInvoiceRepository.updateMany(query, options);
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      query[key]
        ? (query[key] = new RegExp(query[key], 'i'))
        : delete query[key];
    });
    return query;
  }
}
