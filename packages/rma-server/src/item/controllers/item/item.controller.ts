import { Controller, Req, Param, Get, Query, UseGuards } from '@nestjs/common';
import { RetrieveItemQuery } from '../../query/get-item/retrieve-item.query';
import { RetrieveCustomerListQuery } from '../../query/list-customer/retrieve-customer-list.query';
import { QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';

@Controller('item')
export class ItemController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getItem(@Param('uuid') uuid, @Req() req) {
    return await this.queryBus.execute(new RetrieveItemQuery(uuid, req));
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  getItemList(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('sort') sort,
    @Req() clientHttpRequest,
  ) {
    if (sort !== 'ASC') {
      sort = 'DESC';
    }
    return this.queryBus.execute(
      new RetrieveCustomerListQuery(
        offset,
        limit,
        sort,
        search,
        clientHttpRequest,
      ),
    );
  }
}
