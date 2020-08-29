import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { SerialNoHistory } from './serial-no-history.entity';
import { of, from } from 'rxjs';
import { switchMap, map, bufferCount, concatMap } from 'rxjs/operators';
import { MONGO_INSERT_MANY_BATCH_NUMBER } from 'src/constants/app-strings';

@Injectable()
export class SerialNoHistoryService {
  constructor(
    @InjectRepository(SerialNoHistory)
    private readonly serialNoRepository: MongoRepository<SerialNoHistory>,
  ) {}

  async find(query?) {
    return await this.serialNoRepository.find(query);
  }

  async create(serialNoPayload: SerialNoHistory) {
    const serialNo = new SerialNoHistory();
    Object.assign(serialNo, serialNoPayload);
    return await this.serialNoRepository.insertOne(serialNo);
  }

  async findOne(param, options?) {
    return await this.serialNoRepository.findOne(param, options);
  }

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.serialNoRepository.manager.connection
      .getMetadata(SerialNoHistory)
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

  aggregateList(skip = 0, limit = 10, query, sort) {
    return this.asyncAggregate([
      { $match: query },
      { $skip: skip },
      { $limit: limit },
      { $sort: sort },
    ]);
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

  addSerialHistory(serials:string[], update: SerialNoHistory){
    return from(serials).pipe(
      map(serial => {
        update.serial_no = serial
        return of(update)
      }),
      bufferCount(MONGO_INSERT_MANY_BATCH_NUMBER),
      concatMap(data => {
        return from(this.serialNoRepository.insertMany(data)).pipe(switchMap(success => of(true)));
      }),
      switchMap(success=> {
        return of(true);
      })
    )
  }

  async count(query) {
    return await this.serialNoRepository.count(query);
  }
}
