import { InjectRepository } from '@nestjs/typeorm';
import { WarrantyClaim } from './warranty-claim.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class WarrantyClaimService {
  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly warrantyclaimRepository: MongoRepository<WarrantyClaim>,
  ) {}

  async find(query?) {
    return await this.warrantyclaimRepository.find(query);
  }

  async create(warrantyclaim: WarrantyClaim) {
    return await this.warrantyclaimRepository.insertOne(warrantyclaim);
  }

  async findOne(param, options?) {
    return await this.warrantyclaimRepository.findOne(param, options);
  }

  async list(skip, take, sort, filter_query?) {
    let sortQuery;

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = { posting_date: 'desc' };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    const $and: any[] = [filter_query ? this.getFilterQuery(filter_query) : {}];

    const where: { $and: any } = { $and };

    const results = await this.warrantyclaimRepository.find({
      skip,
      take,
      where,
      order: sortQuery,
    });

    return {
      docs: results || [],
      length: await this.warrantyclaimRepository.count(where),
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
    return await this.warrantyclaimRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.warrantyclaimRepository.updateOne(query, options);
  }

  async insertMany(query, options?) {
    return await this.warrantyclaimRepository.insertMany(query, options);
  }
}
