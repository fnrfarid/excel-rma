import { InjectRepository } from '@nestjs/typeorm';
import { StockEntry } from './stock-entry.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class StockEntryService {
  constructor(
    @InjectRepository(StockEntry)
    private readonly stockEntryRepository: MongoRepository<StockEntry>,
  ) {}

  async find(query?) {
    return await this.stockEntryRepository.find(query);
  }

  async create(stockEntry: StockEntry) {
    return await this.stockEntryRepository.insertOne(stockEntry);
  }

  async findOne(param, options?) {
    return await this.stockEntryRepository.findOne(param, options);
  }

  async list(skip, take, sort, filter_query?) {
    let sortQuery;

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = {
        claim_no: 'desc',
      };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    const $and: any[] = [filter_query ? this.getFilterQuery(filter_query) : {}];

    const where: { $and: any } = { $and };

    const results = await this.stockEntryRepository.find({
      skip,
      take,
      where,
      order: sortQuery,
    });

    return {
      docs: results || [],
      length: await this.stockEntryRepository.count(where),
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
    return await this.stockEntryRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.stockEntryRepository.updateOne(query, options);
  }

  async insertMany(query, options?) {
    return await this.stockEntryRepository.insertMany(query, options);
  }
}
