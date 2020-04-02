import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { SerialNo } from './serial-no.entity';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

  async listPurchasedSerial(purchase_receipt_names, skip, take, search = '') {
    const serialNoQuery = {
      purchase_document_no: { $in: purchase_receipt_names },
    };
    const searchQuery = {
      serial_no: { $regex: search, $options: 'i' },
    };

    const $and: any[] = [serialNoQuery, searchQuery];

    const where: { $and: any } = { $and };

    const counter = await this.serialNoRepository.findAndCount({
      where,
      skip,
      take,
    });

    return {
      docs: counter[0] || [],
      length: counter[1],
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.serialNoRepository.deleteOne(query, options);
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
