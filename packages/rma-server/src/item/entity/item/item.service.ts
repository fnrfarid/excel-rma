import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Item } from './item.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: MongoRepository<Item>,
  ) {}

  async find(query?) {
    return await this.itemRepository.find(query);
  }

  async create(customerPayload: Item) {
    const customer = new Item();
    Object.assign(customer, customerPayload);
    return await this.itemRepository.insertOne(customer);
  }

  async findOne(param, options?) {
    return await this.itemRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.itemRepository.manager.connection
      .getMetadata(Item)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.itemRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.itemRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.itemRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.itemRepository.updateOne(query, options);
  }
}
