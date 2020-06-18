import { InjectRepository } from '@nestjs/typeorm';
import { ServiceInvoice } from './service-invoice.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class ServiceInvoiceService {
  constructor(
    @InjectRepository(ServiceInvoice)
    private readonly serviceInvoiceRepository: MongoRepository<ServiceInvoice>,
  ) {}

  async find(query?) {
    return await this.serviceInvoiceRepository.find(query);
  }

  async create(serviceInvoice: ServiceInvoice) {
    const serviceInvoiceObject = new ServiceInvoice();
    Object.assign(serviceInvoiceObject, serviceInvoice);
    return await this.serviceInvoiceRepository.insertOne(serviceInvoiceObject);
  }

  async findOne(param, options?) {
    return await this.serviceInvoiceRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.serviceInvoiceRepository.manager.connection
      .getMetadata(ServiceInvoice)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.serviceInvoiceRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.serviceInvoiceRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.serviceInvoiceRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.serviceInvoiceRepository.updateOne(query, options);
  }
}
