import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: MongoRepository<
      PurchaseInvoice
    >,
  ) {}

  async find(query?) {
    return await this.purchaseInvoiceRepository.find(query);
  }

  async create(purchaseInvoice: PurchaseInvoice) {
    const purchaseInvoiceObject = new PurchaseInvoice();
    Object.assign(purchaseInvoiceObject, purchaseInvoice);
    return await this.purchaseInvoiceRepository.insertOne(
      purchaseInvoiceObject,
    );
  }

  async findOne(param, options?) {
    return await this.purchaseInvoiceRepository.findOne(param, options);
  }

  aggregateList($skip = 0, $limit = 10, $match, $sort, $group) {
    return this.asyncAggregate([
      { $match },
      {
        $lookup: {
          from: 'purchase_receipt',
          localField: 'purchase_receipt_names',
          foreignField: 'name',
          as: 'purchase_receipt',
        },
      },
      {
        $unwind: {
          path: '$purchase_receipt',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $group },
      { $sort },
      { $skip },
      { $limit },
    ]);
  }

  asyncAggregate(query) {
    return of(this.purchaseInvoiceRepository.aggregate(query)).pipe(
      switchMap((aggregateData: any) => {
        return aggregateData.toArray();
      }),
    );
  }

  async list(skip, take, sort, filter_query?) {
    let sortQuery;
    let dateQuery = {};

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = { created_on: 'desc' };
    }
    sortQuery =
      Object.keys(sortQuery).length === 0 ? { created_on: 'desc' } : sortQuery;

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (sortQuery[key] === 'ASC') {
        sortQuery[key] = 1;
      }
      if (sortQuery[key] === 'DESC') {
        sortQuery[key] = -1;
      }
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    if (filter_query && filter_query.fromDate && filter_query.toDate) {
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
    const $group = this.getKeys();

    const where: { $and: any } = { $and };

    const results = await this.aggregateList(
      skip,
      take,
      where,
      sortQuery,
      $group,
    ).toPromise();

    return {
      docs: results || [],
      length: await this.purchaseInvoiceRepository.count(where),
      offset: skip,
    };
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        if (key === 'status' && query[key] === 'All') {
          delete query[key];
        } else if (key === 'fromDate' || key === 'toDate') {
          delete query[key];
        } else {
          query[key] = { $regex: query[key], $options: 'i' };
        }
      } else {
        delete query[key];
      }
    });
    return query;
  }

  getKeys() {
    const group: any = {};
    const keys = this.purchaseInvoiceRepository.manager.connection
      .getMetadata(PurchaseInvoice)
      .ownColumns.map(column => column.propertyName);
    keys.splice(keys.indexOf('_id'), 1);
    keys.splice(keys.indexOf('purchase_receipt_names'), 1);

    group._id = '$' + '_id';
    group.delivered_by = { $addToSet: '$purchase_receipt.deliveredBy' };
    keys.forEach(key => {
      group[key] = {
        $first: '$' + key,
      };
    });
    return group;
  }

  async deleteOne(query, options?) {
    return await this.purchaseInvoiceRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.purchaseInvoiceRepository.updateOne(query, options);
  }

  async insertMany(query, options?) {
    return await this.purchaseInvoiceRepository.insertMany(query, options);
  }
}
