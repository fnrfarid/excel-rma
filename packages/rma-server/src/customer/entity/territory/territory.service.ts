import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Territory } from './territory.entity';

@Injectable()
export class TerritoryService {
  constructor(
    @InjectRepository(Territory)
    private readonly territoryRepository: MongoRepository<Territory>,
  ) {}

  async find(query?) {
    return await this.territoryRepository.find(query);
  }

  async create(territoryPayload: Territory) {
    const customer = new Territory();
    Object.assign(customer, territoryPayload);
    return await this.territoryRepository.insertOne(customer);
  }

  async findOne(param, options?) {
    return await this.territoryRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.territoryRepository.manager.connection
      .getMetadata(Territory)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.territoryRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.territoryRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.territoryRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.territoryRepository.updateOne(query, options);
  }
}
