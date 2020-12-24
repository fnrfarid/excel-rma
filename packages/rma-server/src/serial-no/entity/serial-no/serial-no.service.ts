import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { SerialNo } from './serial-no.entity';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PARSE_REGEX } from '../../../constants/app-strings';

@Injectable()
export class SerialNoService {
  constructor(
    @InjectRepository(SerialNo)
    private readonly serialNoRepository: MongoRepository<SerialNo>,
  ) {}

  async find(query?) {
    return await this.serialNoRepository.find(query);
  }

  async create(serialNoPayload: SerialNo) {
    const serialNo = new SerialNo();
    Object.assign(serialNo, serialNoPayload);
    return await this.serialNoRepository.insertOne(serialNo);
  }

  async findOne(param, options?) {
    return await this.serialNoRepository.findOne(param, options);
  }

  async list(skip, take, sort, filterQuery) {
    let order: unknown;

    try {
      order = JSON.parse(sort);
    } catch (error) {
      order = { serial_no: 'asc' };
    }

    if (Object.keys(order).length === 0) {
      order = { serial_no: 'asc' };
    }

    for (const key of Object.keys(order)) {
      order[key] = order[key].toUpperCase();
    }

    try {
      filterQuery = JSON.parse(filterQuery);
    } catch (error) {
      filterQuery = {};
    }

    const $and: unknown[] = [
      filterQuery ? this.getFilterQuery(filterQuery) : {},
    ];

    const where: { $and: unknown[] } = { $and };
    const results = await this.serialNoRepository.findAndCount({
      skip,
      take,
      where,
      order,
    });

    return {
      docs: results[0] || [],
      length: results[1],
      offset: skip,
    };
  }

  getFilterQuery(query: unknown) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (typeof query[key] === 'string') {
        query[key] = { $regex: PARSE_REGEX(query[key]), $options: 'i' };
      } else {
        delete query[key];
      }
    });
    return query;
  }

  async listPurchasedSerial(purchase_invoice_name, skip, take, search = '') {
    const searchQuery: any = { purchase_invoice_name };

    if (search && search !== '') {
      searchQuery.serial_no = { $regex: search.toUpperCase() };
    }

    return {
      docs: await this.aggregateList(skip, take, searchQuery).toPromise(),
      length: await this.serialNoRepository.count(searchQuery),
      offset: skip,
    };
  }

  aggregateList(skip = 0, limit = 10, query, sort?) {
    return this.asyncAggregate([
      { $match: query },
      { $skip: skip },
      { $limit: limit },
    ]);
  }

  async listDeliveredSerial(sales_invoice_name, search, skip = 0, take = 10) {
    const serialNoQuery: any = { sales_invoice_name };

    if (search && search !== '') {
      serialNoQuery.serial_no = { $regex: search.toUpperCase() };
    }

    return {
      docs: await this.aggregateList(skip, take, serialNoQuery).toPromise(),
      length: await this.serialNoRepository.count(serialNoQuery),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.serialNoRepository.deleteOne(query, options);
  }

  async deleteMany(query, options?) {
    return await this.serialNoRepository.deleteMany(query, options);
  }

  async updateOne(query, options?) {
    return await this.serialNoRepository.updateOne(query, options);
  }

  async updateMany(query, options?) {
    return await this.serialNoRepository.updateMany(query, options);
  }

  async insertMany(query, options?) {
    return await this.serialNoRepository.insertMany(query, options);
  }

  asyncAggregate(query) {
    return of(this.serialNoRepository.aggregate(query)).pipe(
      switchMap((aggregateData: any) => {
        return aggregateData.toArray();
      }),
    );
  }

  async count(query) {
    return await this.serialNoRepository.count(query);
  }
}

export class AggregatePaginationResponse {
  length: { total: string }[];
  docs: any[];
}
