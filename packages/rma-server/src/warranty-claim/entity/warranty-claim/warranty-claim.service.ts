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

  async list(skip, take, search, sort) {
    const nameExp = new RegExp(search, 'i');
    const columns = this.warrantyclaimRepository.manager.connection
      .getMetadata(WarrantyClaim)
      .ownColumns.map(column => column.propertyName);

    const $or = columns.map(field => {
      const filter = {};
      filter[field] = nameExp;
      return filter;
    });
    const $and: any[] = [{ $or }];

    const where: { $and: any } = { $and };

    const results = await this.warrantyclaimRepository.find({
      skip,
      take,
      where,
    });

    return {
      docs: results || [],
      length: await this.warrantyclaimRepository.count(where),
      offset: skip,
    };
  }

  async deleteOne(query, options?) {
    return await this.warrantyclaimRepository.deleteOne(query, options);
  }

  async updateOne(query, options?) {
    return await this.warrantyclaimRepository.updateOne(query, options);
  }
}
