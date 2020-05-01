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
import { CreateSalesReturnCommand } from '../../command/create-sales-return/create-sales-return.command';
import { CreateSalesReturnDto } from '../../entity/sales-invoice/sales-return-dto';
import { SalesInvoiceListQueryDto } from '../../../constants/listing-dto/sales-invoice-list-query';
import { CancelSalesInvoiceCommand } from '../../command/cancel-sales-invoice/cancel-sales-invoice.command';
import { SalesInvoiceAggregateService } from '../../aggregates/sales-invoice-aggregate/sales-invoice-aggregate.service';

@Controller('sales_invoice')
export class SalesInvoiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly salesInvoiceAggregate: SalesInvoiceAggregateService,
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
  updateClient(@Body() updatePayload: SalesInvoiceUpdateDto, @Req() req) {
    return this.commandBus.execute(
      new UpdateSalesInvoiceCommand(updatePayload, req),
    );
  }

  @Post('v1/submit/:uuid')
  @UseGuards(TokenGuard)
  @UsePipes()
  submitSalesInvoice(@Param('uuid') uuid: string, @Req() req) {
    return this.commandBus.execute(new SubmitSalesInvoiceCommand(uuid, req));
  }

  @Post('v1/cancel/:uuid')
  @UseGuards(TokenGuard)
  cancelSalesInvoice(@Param('uuid') uuid: string, @Req() req) {
    return this.commandBus.execute(new CancelSalesInvoiceCommand(uuid, req));
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
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async listSalesInvoice(@Query() query: SalesInvoiceListQueryDto, @Req() req) {
    const { offset, limit, sort, filter_query } = query;
    let filter = {};
    try {
      filter = JSON.parse(filter_query);
    } catch {
      filter;
    }
    return await this.queryBus.execute(
      new RetrieveSalesInvoiceListQuery(offset, limit, sort, filter, req),
    );
  }

  @Post('v1/create_return')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createReturn(@Body() createReturnPayload: CreateSalesReturnDto, @Req() req) {
    return this.commandBus.execute(
      new CreateSalesReturnCommand(createReturnPayload, req),
    );
  }

  @Post('v1/update_outstanding_amount/:name')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateOutstandingAmount(@Param('name') invoice_name: string) {
    return await this.salesInvoiceAggregate
      .updateOutstandingAmount(invoice_name)
      .toPromise();
  }
}
