import { InjectRepository } from '@nestjs/typeorm';
import { WarrantyClaim } from './warranty-claim.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { DEFAULT_NAMING_SERIES } from '../../../constants/app-strings';

@Injectable()
export class WarrantyClaimService {
  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly warrantyClaimRepository: MongoRepository<WarrantyClaim>,
  ) {}

  async find(query?) {
    return await this.warrantyClaimRepository.find(query);
  }

  async create(warrantyclaim: WarrantyClaim) {
    warrantyclaim.claim_no = await this.generateNamingSeries();
    return await this.warrantyClaimRepository.insertOne(warrantyclaim);
  }

  async findOne(param, options?) {
    return await this.warrantyClaimRepository.findOne(param, options);
  }

  async list(skip, take, sort, filter_query?, clientHttpRequest?) {
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
        created_on: {
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
          $in: filter_query.territory,
        },
      },
      {
        'status_history.status_from': {
          $in: filter_query.territory,
        },
      },
    ];

    const $and: any[] = [
      { $or },
      filter_query
        ? filter_query.territory
          ? {}
          : this.getFilterQuery(filter_query)
        : {},
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
    return await this.warrantyClaimRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.warrantyClaimRepository.updateOne(query, options);
  }

  async insertMany(query, options?) {
    return await this.warrantyClaimRepository.insertMany(query, options);
  }

  async count(query) {
    return await this.warrantyClaimRepository.count(query);
  }

  async generateNamingSeries() {
    let res = await this.count({});
    res += 1;
    return DEFAULT_NAMING_SERIES.warranty_claim + res;
  }
}
