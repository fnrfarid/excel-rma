import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { StockEntryAggregateService } from '../aggregates/stock-entry-aggregate/stock-entry-aggregate.service';
import { StockEntryDto } from '../stock-entry/stock-entry-dto';
import { TokenGuard } from '../../auth/guards/token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { throwError } from 'rxjs';
import { INVALID_FILE } from '../../constants/app-strings';
import { PurchaseInvoiceListQueryDto } from '../../constants/listing-dto/purchase-invoice-list-query';

@Controller('stock_entry')
export class StockEntryController {
  constructor(private readonly aggregate: StockEntryAggregateService) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() body: StockEntryDto, @Req() req) {
    return this.aggregate.createStockEntry(body, req);
  }

  @Post('v1/create_from_file')
  @UseGuards(TokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createFromFile(@Req() req, @UploadedFile('file') file) {
    if (file) {
      return this.aggregate.StockEntryFromFile(file, req);
    }
    return throwError(new BadRequestException(INVALID_FILE));
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
    return this.aggregate.getStockEntryList(
      Number(offset) || 0,
      Number(limit) || 10,
      sort,
      filter,
    );
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  getStockEntry(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.getStockEntry(uuid);
  }

  @Post('v1/accept_transfer/:uuid')
  @UseGuards(TokenGuard)
  acceptStockEntry(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.acceptStockEntry(uuid, req);
  }

  @Post('v1/reject_transfer/:uuid')
  @UseGuards(TokenGuard)
  rejectStockEntry(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.rejectStockEntry(uuid, req);
  }
}
