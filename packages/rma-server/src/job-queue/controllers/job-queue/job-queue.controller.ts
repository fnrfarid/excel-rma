import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Query,
  Param,
  Req,
} from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { JobQueueListQueryDto } from '../../../constants/listing-dto/job-queue-list-query.dto';
import { JobQueueAggregateService } from '../../aggregates/job-queue-aggregate/job-queue-aggregate.service';

@Controller('job_queue')
export class JobQueueController {
  constructor(private readonly aggregate: JobQueueAggregateService) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  async create(@Body('jobId') jobId: string) {
    return await this.aggregate.create(jobId);
  }

  @Get('v1/retrieve/:jobId')
  @UseGuards(TokenGuard)
  async retrieve(@Param('jobId') jobId: string) {
    return await this.aggregate.retrieveOne(jobId);
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  async list(@Query() query: JobQueueListQueryDto, @Req() req) {
    const { offset = 0, limit = 10, sort, filter_query } = query;
    let filter = {};
    try {
      filter = JSON.parse(filter_query);
    } catch {
      filter;
    }
    return await this.aggregate.list(
      offset,
      limit,
      sort,
      filter_query,
      req.token,
    );
  }
}
