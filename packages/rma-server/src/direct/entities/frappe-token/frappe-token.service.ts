import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { FrappeToken } from './frappe-token.entity';
import { DEFAULT } from '../../../constants/typeorm.connection';

@Injectable()
export class FrappeTokenService {
  constructor(
    @InjectRepository(FrappeToken, DEFAULT)
    private readonly frappeTokenRepo: MongoRepository<FrappeToken>,
  ) {}

  async save(params) {
    return await this.frappeTokenRepo.save(params);
  }

  async find(): Promise<FrappeToken[]> {
    return await this.frappeTokenRepo.find();
  }

  async findOne(params) {
    return await this.frappeTokenRepo.findOne(params);
  }

  async update(query, params) {
    return await this.frappeTokenRepo.update(query, params);
  }

  async count() {
    return await this.frappeTokenRepo.count();
  }

  async paginate(skip: number, take: number) {
    return await this.frappeTokenRepo.find({ skip, take });
  }

  async deleteMany(params) {
    return await this.frappeTokenRepo.deleteMany(params);
  }
}
