import { InjectRepository } from '@nestjs/typeorm';
import { SalesInvoice } from './sales-invoice.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class SalesInvoiceService {
  constructor(
    @InjectRepository(SalesInvoice)
    private readonly salesInvoiceRepository: MongoRepository<SalesInvoice>,
  ) {}

  async find() {
    return await this.salesInvoiceRepository.find();
  }

  async create(salesInvoice: SalesInvoice) {
    return await this.salesInvoiceRepository.insertOne(salesInvoice);
  }

  async findOne(query, param?, flag = false) {
    const select: any[] = this.getColumns();
    flag ? select.splice(select.indexOf('delivery_note_items'), 1) : select;
    return await this.salesInvoiceRepository.findOne({
      select,
      where: query,
    });
  }

  async list(skip, take, sort, filter_query?) {
    let sortQuery;
    let dateQuery = {};
    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = { created_on: 'desc' };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    if (filter_query.fromDate && filter_query.toDate) {
      dateQuery = {
        created_on: {
          $gte: new Date(filter_query.fromDate),
          $lte: new Date(filter_query.toDate),
        },
      };
    }

    const $and: any[] = [
      filter_query ? this.getFilterQuery(filter_query) : {},
      dateQuery,
    ];

    const where: { $and: any } = { $and };

    const select: any[] = this.getColumns();
    select.splice(select.indexOf('delivery_note_items'), 1);
    const results = await this.salesInvoiceRepository.find({
      skip,
      take,
      where,
      order: sortQuery,
      select,
    });

    return {
      docs: results || [],
      length: await this.salesInvoiceRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, param?) {
    return await this.salesInvoiceRepository.deleteOne(query, param);
  }

  async updateOne(query, param) {
    return await this.salesInvoiceRepository.updateOne(query, param);
  }

  async updateMany(query, options?) {
    return await this.salesInvoiceRepository.updateMany(query, options);
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (typeof query[key] !== 'undefined') {
        if (key === 'status' && query[key] === 'All') {
          delete query[key];
        } else if (key === 'isCampaign' && query[key] === true) {
          query[key] = true;
        } else if (key === 'isCampaign' && query[key] === false) {
          query[key] = false;
        } else if (key === 'fromDate') {
          delete query[key];
        } else if (key === 'toDate') {
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

  asyncAggregate(query) {
    return of(this.salesInvoiceRepository.aggregate(query)).pipe(
      switchMap((aggregateData: any) => {
        return aggregateData.toArray();
      }),
    );
  }

  getColumns() {
    return this.salesInvoiceRepository.manager.connection
      .getMetadata(SalesInvoice)
      .ownColumns.map(column => column.propertyName);
  }
}
