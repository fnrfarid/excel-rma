import { InjectRepository } from '@nestjs/typeorm';
import { AgendaJob } from './agenda-job.entity';
import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';

@Injectable()
export class AgendaJobService {
  constructor(
    @InjectRepository(AgendaJob)
    private readonly agendaJobRepository: MongoRepository<AgendaJob>,
  ) {}

  async find() {
    return await this.agendaJobRepository.find();
  }

  async findOne(query) {
    return await this.agendaJobRepository.findOne(query);
  }

  async list(skip, take, sort, filter_query?) {
    let sortQuery;

    try {
      sortQuery = JSON.parse(sort);
    } catch (error) {
      sortQuery = { createdOn: 'desc' };
    }

    for (const key of Object.keys(sortQuery)) {
      sortQuery[key] = sortQuery[key].toUpperCase();
      if (!sortQuery[key]) {
        delete sortQuery[key];
      }
    }

    const $and: any[] = [filter_query ? this.getFilterQuery(filter_query) : {}];

    const where: { $and: any } = { $and };
    const results = await this.agendaJobRepository.find({
      skip,
      take,
      where,
      order: sortQuery,
    });

    return {
      docs: results || [],
      length: await this.agendaJobRepository.count(where),
      offset: skip,
    };
  }

  getFilterQuery(query) {
    const keys = Object.keys(query);
    keys.forEach(key => {
      if (query[key]) {
        query[key] = new RegExp(query[key], 'i');
      } else {
        delete query[key];
      }
    });
    return query;
  }
}
