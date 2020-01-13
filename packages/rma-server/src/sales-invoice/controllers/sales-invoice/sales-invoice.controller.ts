import {
  Controller,
  Post,
  UseGuards,
  UsePipes,
  Body,
  ValidationPipe,
  Req,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { SalesInvoiceDto } from '../../entity/sales-invoice/sales-invoice-dto';
import { SalesInvoiceUpdateDto } from '../../entity/sales-invoice/sales-invoice-update-dto';
import { AddSalesInvoiceCommand } from '../../command/add-sales-invoice/add-sales-invoice.command';
import { RemoveSalesInvoiceCommand } from '../../command/remove-sales-invoice/remove-sales-invoice.command';
import { UpdateSalesInvoiceCommand } from '../../command/update-sales-invoice/update-sales-invoice.command';
import { RetrieveSalesInvoiceListQuery } from '../../query/list-sales-invoice/retrieve-sales-invoice-list.query';
import { RetrieveSalesInvoiceQuery } from '../../query/get-sales-invoice/retrieve-sales-invoice.query';
import { SubmitSalesInvoiceCommand } from '../../command/submit-sales-invoice/submit-sales-invoice.command';

@Controller('sales_invoice')
export class SalesInvoiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() salesInvoicePayload: SalesInvoiceDto, @Req() req) {
    return this.commandBus.execute(
      new AddSalesInvoiceCommand(salesInvoicePayload, req),
    );
  }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  remove(@Param('uuid') uuid) {
    return this.commandBus.execute(new RemoveSalesInvoiceCommand(uuid));
  }

  @Post('v1/update')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateClient(@Body() updatePayload: SalesInvoiceUpdateDto) {
    return this.commandBus.execute(
      new UpdateSalesInvoiceCommand(updatePayload),
    );
  }

  @Post('v1/submit/:uuid')
  @UseGuards(TokenGuard)
  @UsePipes()
  submitSalesInvoice(@Param('uuid') uuid: string, @Req() req) {
    return this.commandBus.execute(new SubmitSalesInvoiceCommand(uuid, req));
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getSalesInvoice(@Param('uuid') uuid, @Req() req) {
    return await this.queryBus.execute(
      new RetrieveSalesInvoiceQuery(uuid, req),
    );
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  async listSalesInvoice(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('sort') sort,
  ) {
    if (sort !== 'ASC') {
      sort = 'DESC';
    }
    return await this.queryBus.execute(
      new RetrieveSalesInvoiceListQuery(offset, limit, search, sort),
    );
  }
}
