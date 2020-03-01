import {
  Controller,
  Get,
  UseGuards,
  Param,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { QueryBus } from '@nestjs/cqrs';
import { RetrievePurchaseOrderQuery } from '../../query/get-purchase-order/retrieve-purchase-order.query';
import { RetrievePurchaseOrderListQuery } from '../../query/list-purchase-order/retrieve-purchase-order-list.query';
import { PurchaseOrderListQueryDto } from '../../../constants/listing-dto/purchase-order-list-query';

@Controller('purchase_order')
export class PurchaseOrderController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getClient(@Param('uuid') uuid: string) {
    return await this.queryBus.execute(new RetrievePurchaseOrderQuery(uuid));
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async getPurchaseInvoiceList(@Query() query: PurchaseOrderListQueryDto) {
    const { offset, limit, sort, filter_query } = query;
    let filter;
    try {
      filter = JSON.parse(filter_query);
    } catch {
      filter;
    }
    return await this.queryBus.execute(
      new RetrievePurchaseOrderListQuery(offset, limit, sort, filter),
    );
  }
}
