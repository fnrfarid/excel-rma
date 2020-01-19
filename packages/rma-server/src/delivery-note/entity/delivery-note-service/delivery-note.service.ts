import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryNote } from './delivery-note.entity';
import { MongoRepository } from 'typeorm';
import { DEFAULT } from '../../../constants/typeorm.connection';

@Injectable()
export class DeliveryNoteService {
  constructor(
    @InjectRepository(DeliveryNote, DEFAULT)
    private readonly deliveryNoteRepo: MongoRepository<DeliveryNote>,
  ) {}

  async save(params) {
    return await this.deliveryNoteRepo.save(params);
  }

  async find(): Promise<DeliveryNote[]> {
    return await this.deliveryNoteRepo.find();
  }

  async findOne(params) {
    return await this.deliveryNoteRepo.findOne(params);
  }

  async update(query, params) {
    return await this.deliveryNoteRepo.update(query, params);
  }

  async updateMany(query, params) {
    return await this.deliveryNoteRepo.updateMany(query, params);
  }

  async updateOne(query, params) {
    return await this.deliveryNoteRepo.updateOne(query, params);
  }

  async count() {
    return await this.deliveryNoteRepo.count();
  }

  async paginate(skip: number, take: number) {
    return await this.deliveryNoteRepo.find({ skip, take });
  }

  async deleteMany(params) {
    return await this.deliveryNoteRepo.deleteMany(params);
  }
}
