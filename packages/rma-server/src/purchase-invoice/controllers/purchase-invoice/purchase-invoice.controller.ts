import {
  Controller,
  Post,
  UseGuards,
  Req,
  Param,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { RemovePurchaseInvoiceCommand } from '../../command/remove-purchase-invoice/remove-purchase-invoice.command';
import { RetrievePurchaseInvoiceQuery } from '../../query/get-purchase-invoice/retrieve-purchase-invoice.query';
import { RetrievePurchaseInvoiceListQuery } from '../../query/list-purchase-invoice/retrieve-purchase-invoice-list.query';
import { PurchaseInvoiceListQueryDto } from '../../../constants/listing-dto/purchase-invoice-list-query';
// import { PurchaseInvoiceDto } from '../../entity/purchase-invoice/purchase-invoice-dto';
// import { AddPurchaseInvoiceCommand } from '../../command/add-purchase-invoice/add-purchase-invoice.command';
// import { UpdatePurchaseInvoiceCommand } from '../../command/update-purchase-invoice/update-purchase-invoice.command';
// import { UpdatePurchaseInvoiceDto } from '../../entity/purchase-invoice/update-purchase-invoice-dto';

@Controller('purchase_invoice')
export class PurchaseInvoiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // @Post('v1/create')
  // @UseGuards(TokenGuard)
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  // create(@Body() purchaseInvoicePayload: PurchaseInvoiceDto, @Req() req) {
  //   return this.commandBus.execute(new AddPurchaseInvoiceCommand(purchaseInvoicePayload, req));
  // }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  remove(@Param('uuid') uuid: string) {
    return this.commandBus.execute(new RemovePurchaseInvoiceCommand(uuid));
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getClient(@Param('uuid') uuid: string, @Req() req) {
    return await this.queryBus.execute(
      new RetrievePurchaseInvoiceQuery(uuid, req),
    );
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  getPurchaseInvoiceList(@Query() query: PurchaseInvoiceListQueryDto) {
    const { offset, limit, sort, filter_query } = query;
    let filter;
    try {
      filter = JSON.parse(filter_query);
    } catch {
      filter;
    }
    return this.queryBus.execute(
      new RetrievePurchaseInvoiceListQuery(offset, limit, sort, filter),
    );
  }

  // @Post('v1/update')
  // @UseGuards(TokenGuard)
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  // updateClient(@Body() updatePayload: UpdatePurchaseInvoiceDto) {
  //   return this.commandBus.execute(new UpdatePurchaseInvoiceCommand(updatePayload));
  // }
}
