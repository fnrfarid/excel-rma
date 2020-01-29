import {
  Controller,
  Req,
  Param,
  Get,
  Query,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { RetrieveItemQuery } from '../../query/get-item/retrieve-item.query';
import { RetrieveItemListQuery } from '../../query/list-item/retrieve-item-list.query';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_MANAGER } from '../../../constants/app-strings';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { SetMinimumItemPriceCommand } from '../../commands/set-minimum-item-price/set-minimum-item-price.command';

@Controller('item')
export class ItemController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getItem(@Param('uuid') uuid, @Req() req) {
    return await this.queryBus.execute(new RetrieveItemQuery(uuid, req));
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  async getItemList(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('sort') sort,
    @Req() clientHttpRequest,
  ) {
    if (!sort) {
      sort = 'asc';
    }
    return await this.queryBus.execute(
      new RetrieveItemListQuery(offset, limit, sort, search, clientHttpRequest),
    );
  }

  @Roles(SYSTEM_MANAGER)
  @Post('v1/set_minimum_item_price/:uuid')
  @UseGuards(TokenGuard, RoleGuard)
  async setMinimumItemPrice(
    @Param('uuid') uuid,
    @Body('minimumPrice') minimumPrice,
  ) {
    return await this.commandBus.execute(
      new SetMinimumItemPriceCommand(uuid, minimumPrice),
    );
  }
}
