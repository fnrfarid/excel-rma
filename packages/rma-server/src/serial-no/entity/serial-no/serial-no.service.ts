import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { SerialNo } from './serial-no.entity';
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

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

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.serialNoRepository.manager.connection
      .getMetadata(SerialNo)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.serialNoRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.serialNoRepository.count(where),
      offset: skip,
    };
  }

  listPurchasedSerial(purchase_receipt_names, skip, take, search = '') {
    const serialNoQuery = {
      purchase_document_no: { $in: purchase_receipt_names },
    };

    let searchQuery = {};
    const $and: any[] = [];

    if (search && search !== '') {
      searchQuery = {
        serial_no: { $regex: search.toUpperCase() },
      };
      $and.push(searchQuery);
    }

    $and.push(serialNoQuery);
    const sort = { $sort: { 'warranty.purchasedOn': -1 } };
    return this.aggregateList($and, skip, take, sort);
  }

  aggregateList(and, skip, take, sort?) {
    sort = sort ? sort : { $sort: { _id: -1 } };
    return this.asyncAggregate([
      {
        $match: { $and: and },
      },
      {
        $facet: {
          docs: [sort, { $skip: skip }, { $limit: take }],
          length: [{ $count: 'total' }],
        },
      },
    ]).pipe(
      map(data => data[0]),
      switchMap((data: AggregatePaginationResponse) => {
        return of({
          docs: data.docs,
          length:
            data.length[0] && data.length[0].total ? data.length[0].total : 0,
          offset: skip,
        });
      }),
    );
  }

  async listDeliveredSerial(delivery_note_names, search, skip = 0, take = 10) {
    const serialNoQuery = {
      delivery_note: { $in: delivery_note_names },
    };

    let searchQuery = {};
    const $and: any[] = [];

    if (search && search !== '') {
      searchQuery = {
        serial_no: { $regex: search.toUpperCase() },
      };
      $and.push(searchQuery);
    }

    $and.push(serialNoQuery);
    const sort = { $sort: { 'warranty.soldOn': -1 } };
    return this.aggregateList($and, skip, take, sort);
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
