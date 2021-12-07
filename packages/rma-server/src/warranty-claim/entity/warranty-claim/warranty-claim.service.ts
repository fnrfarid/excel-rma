import { InjectRepository } from '@nestjs/typeorm';
import { WarrantyClaim } from './warranty-claim.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import {
  CATEGORY,
  DEFAULT_NAMING_SERIES,
} from '../../../constants/app-strings';
import { PARSE_REGEX } from '../../../constants/app-strings';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class WarrantyClaimService {
  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly warrantyClaimRepository: MongoRepository<WarrantyClaim>,
    private readonly settings: SettingsService,
  ) {}

  async find(query?) {
    return await this.warrantyClaimRepository.find(query);
  }

  async create(warrantyclaim: WarrantyClaim) {
    warrantyclaim.claim_no = await this.generateNamingSeries(warrantyclaim.set);
    const data = await this.warrantyClaimRepository
      .insertOne(warrantyclaim)
      .catch(err => {
        return this.generateErrorNamingSeries(warrantyclaim.set).then(res => {
          warrantyclaim.claim_no = res;
          return this.warrantyClaimRepository.insertOne(warrantyclaim);
        });
      });
    return data;
  }

  async findOne(param, options?) {
    return await this.warrantyClaimRepository.findOne(param, options);
  }

  async list(skip, take, sort, filter_query?, territory?, clientHttpRequest?) {
    let sortQuery;
    let dateQuery = {};

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = {
        modifiedOn: 'desc',
      };
    }
    sortQuery =
      Object.keys(sortQuery).length === 0 ? { modifiedOn: 'desc' } : sortQuery;

    if (filter_query?.fromDate && filter_query?.toDate) {
      dateQuery = {
        createdOn: {
          $gte: new Date(filter_query.fromDate),
          $lte: new Date(filter_query.toDate),
        },
      };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }
    const $or: any[] = [
      {
        'status_history.transfer_branch': {
          $in: clientHttpRequest.token.territory,
        },
      },
      {
        'status_history.status_from': {
          $in: clientHttpRequest.token.territory,
        },
      },
    ];

    const $and: any[] = [
      { $or },
      { set: { $in: territory.set } },
      filter_query ? this.getFilterQuery(filter_query) : {},
      dateQuery,
    ];

    const where: { $and: any } = { $and };

    const results = await this.warrantyClaimRepository.findAndCount({
      skip,
      take,
      where,
      order: sortQuery,
    });

    return {
      docs: results[0] || [],
      length: results[1],
      offset: skip,
    };
  }

  async report(filter_query) {
    let dateQuery = {};
    if (filter_query?.fromDate && filter_query?.toDate) {
      dateQuery = {
        createdOn: {
          $gte: new Date(new Date(filter_query.fromDate).setHours(0, 0, 0, 0)),
          $lte: new Date(
            new Date(filter_query.toDate).setHours(23, 59, 59, 59),
          ),
        },
      };
    }

    const $and: any[] = [
      filter_query ? this.getReportFilterQuery(filter_query) : {},
      dateQuery,
    ];

    const where: { $and: any } = { $and };

    const results = await this.warrantyClaimRepository.findAndCount({
      where,
    });

    return {
      docs: results[0] || [],
      length: results[1],
    };
  }

  getReportFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        if (key === 'fromDate' || key === 'toDate') {
          delete query[key];
        }
      } else {
        delete query[key];
      }
    });
    return query;
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        if (key === 'claim_status' && query[key] === 'All') {
          delete query[key];
        } else {
          if (typeof query[key] === 'string') {
            if (['claim_type'].includes(key)) {
              return;
            }
            query[key] = { $regex: PARSE_REGEX(query[key]), $options: 'i' };
          } else {
            delete query[key];
          }
        }
      } else {
        delete query[key];
      }
    });
    return query;
  }

  async deleteOne(query, options?) {
    return await this.warrantyClaimRepository.deleteOne(query, options);
  }

  async deleteMany(query, options?) {
    return await this.warrantyClaimRepository.deleteMany(query, options);
  }

  async updateOne(query, options?) {
    return await this.warrantyClaimRepository.updateOne(query, options);
  }

  async updateMany(query, options?) {
    return await this.warrantyClaimRepository.updateMany(query, options);
  }

  async insertMany(query, options?) {
    return await this.warrantyClaimRepository.insertMany(query, options);
  }

  async count(query) {
    return await this.warrantyClaimRepository.count(query);
  }

  asyncAggregate(query) {
    return of(this.warrantyClaimRepository.aggregate(query)).pipe(
      switchMap((aggregateData: any) => {
        return aggregateData.toArray();
      }),
    );
  }

  async generateNamingSeries(type: string) {
    const settings = await this.settings.find().toPromise();
    const date = new DateTime(settings.timeZone).year;
    let count;
    switch (type) {
      case 'Bulk':
        count = await this.asyncAggregate([
          {
            $match: {
              $expr: { $eq: [{ $year: '$createdOn' }, date] },
              set: type,
            },
          },
          { $count: 'total' },
        ]).toPromise();
        count = (count[0]?.total || 0) + 1;
        return DEFAULT_NAMING_SERIES.bulk_warranty_claim + date + '-' + count;

      default:
        count = await this.asyncAggregate([
          {
            $match: {
              $expr: { $eq: [{ $year: '$createdOn' }, date] },
              $or: [{ set: CATEGORY.SINGLE }, { set: CATEGORY.PART }],
            },
          },
          { $count: 'total' },
        ]).toPromise();
        count = (count[0]?.total || 0) + 1;
        return DEFAULT_NAMING_SERIES.warranty_claim + date + '-' + count;
    }
  }

  async generateErrorNamingSeries(type: string) {
    const settings = await this.settings.find().toPromise();
    const date = new DateTime(settings.timeZone).year;
    let lastCreatedClaim;
    switch (type) {
      case 'Bulk':
        lastCreatedClaim = await this.asyncAggregate([
          {
            $match: {
              $expr: { $eq: [{ $year: '$createdOn' }, date] },
              set: type,
            },
          },
          { $sort: { createdOn: -1 } },
          { $limit: 1 },
        ]).toPromise();
        return this.generateClaimString(lastCreatedClaim);

      default:
        lastCreatedClaim = await this.asyncAggregate([
          {
            $match: {
              $expr: { $eq: [{ $year: '$createdOn' }, date] },
              $or: [{ set: CATEGORY.SINGLE }, { set: CATEGORY.PART }],
            },
          },
          { $sort: { createdOn: -1 } },
          { $limit: 1 },
        ]).toPromise();
        return this.generateClaimString(lastCreatedClaim);
    }
  }

  generateClaimString(claim_no) {
    claim_no = claim_no[0].claim_no.split('-');
    claim_no[2] = parseInt(claim_no[2], 10) + 1;
    claim_no = claim_no.join('-');
    return claim_no;
  }
}
