import {
  Controller,
  Req,
  Param,
  Get,
  Query,
  UseGuards,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { RetrieveItemQuery } from '../../query/get-item/retrieve-item.query';
import { RetrieveItemListQuery } from '../../query/list-item/retrieve-item-list.query';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_MANAGER } from '../../../constants/app-strings';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { SetMinimumItemPriceCommand } from '../../commands/set-minimum-item-price/set-minimum-item-price.command';
import { RetrieveItemByCodeQuery } from '../../query/get-item-by-code/retrieve-item-by-code-.query';
import { RetrieveItemByNamesQuery } from '../../query/get-item-by-names/retrieve-item-by-names-.query';
import { INVALID_ITEM_NAME_QUERY } from '../../../constants/messages';
import { SetPurchaseWarrantyDaysCommand } from '../../commands/set-purchase-warranty-days/set-purchase-warranty-days.command';

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

  @Get('v1/get_by_item_code/:code')
  @UseGuards(TokenGuard)
  async getItemByCode(@Param('code') code, @Req() req) {
    return await this.queryBus.execute(new RetrieveItemByCodeQuery(code, req));
  }

  @Get('v1/get_by_names')
  @UseGuards(TokenGuard)
  async getItemByNames(@Query('item_names') item_names: string, @Req() req) {
    let query = [];
    try {
      query = JSON.parse(item_names);
    } catch {
      throw new BadRequestException(INVALID_ITEM_NAME_QUERY);
    }
    return await this.queryBus.execute(
      new RetrieveItemByNamesQuery(query, req),
    );
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

  @Roles(SYSTEM_MANAGER)
  @Post('v1/set_purchase_warranty_days/:uuid')
  @UseGuards(TokenGuard, RoleGuard)
  async setPurchaseWarrantyDays(@Param('uuid') uuid, @Body('days') days) {
    return await this.commandBus.execute(
      new SetPurchaseWarrantyDaysCommand(uuid, days),
    );
  }
}
