import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Item } from './item.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly customerRepository: MongoRepository<Item>,
  ) {}

  async find(query?) {
    return await this.customerRepository.find(query);
  }

  async create(customerPayload: Item) {
    const customer = new Item();
    Object.assign(customer, customerPayload);
    return await this.customerRepository.insertOne(customer);
  }

  async findOne(param, options?) {
    return await this.customerRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.customerRepository.manager.connection
      .getMetadata(Item)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.customerRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.customerRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.customerRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.customerRepository.updateOne(query, options);
  }
}
