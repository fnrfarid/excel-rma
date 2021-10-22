import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WarrantyClaim } from '../../../warranty-claim/entity/warranty-claim/warranty-claim.entity';
import { MongoRepository } from 'typeorm';

@Injectable()
export class WarrantyClaimAnalysisService {
  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly warrantyClaimRepository: MongoRepository<WarrantyClaim>,
  ) {}

  async list(filter_query) {
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
      filter_query ? this.getFilterQuery(filter_query) : {},
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

  getFilterQuery(query) {
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
}
