import { InjectRepository } from '@nestjs/typeorm';
import { StockEntry } from './stock-entry.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { STOCK_ENTRY_LIST_ITEM_SELECT_KEYS } from '../../constants/app-strings';
import { PARSE_REGEX } from '../../constants/app-strings';

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
    const query: any = {};

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = {
        _id: 'DESC',
      };
    }

    for (const key of Object.keys(sortQuery)) {
      if (!sortQuery[key]) {
        delete sortQuery[key];
      } else {
        sortQuery[key] = sortQuery[key].toUpperCase();
      }
    }

    if (filter_query?.fromDate && filter_query?.toDate) {
      query.createdAt = {
        $gte: new Date(filter_query.fromDate),
        $lte: new Date(filter_query.toDate),
      };
      delete filter_query.fromDate;
      delete filter_query.toDate;
    }

    if (filter_query?.warrantyClaimUuid) {
      query.warrantyClaimUuid = filter_query.warrantyClaimUuid;
      delete filter_query.warrantyClaimUuid;
    }

    const $and: any[] = [
      filter_query ? this.getFilterQuery(filter_query) : {},
      query,
    ];

    const where: { $and: any } = { $and };

    const select: string[] = this.getSelectKeys();

    // this is to override the type or typeorm select, it dose not support child objects in query builder.
    const db: any = this.stockEntryRepository;

    const results = await db.find({
      skip,
      take,
      where,
      order: sortQuery,
      select,
    });

    return {
      docs: results || [],
      length: await db.count(where),
      offset: skip,
    };
  }

  getSelectKeys() {
    const select = STOCK_ENTRY_LIST_ITEM_SELECT_KEYS.map(key => `items.${key}`);
    select.push(
      ...this.stockEntryRepository.manager.connection
        .getMetadata(StockEntry)
        .ownColumns.map(column => column.propertyName),
    );
    select.splice(select.indexOf('items'), 1);
    return select;
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        if (typeof query[key] === 'string') {
          query[key] = { $regex: PARSE_REGEX(query[key]), $options: 'i' };
        } else {
          delete query[key];
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
