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
import { StockEntryDto } from '../entities/stock-entry-dto';
import { TokenGuard } from '../../auth/guards/token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { throwError } from 'rxjs';
import { INVALID_FILE } from '../../constants/app-strings';
import { PurchaseInvoiceListQueryDto } from '../../constants/listing-dto/purchase-invoice-list-query';
import { WarrantyStockEntryAggregateService } from '../aggregates/warranty-stock-entry-aggregate/warranty-stock-entry-aggregate.service';
import { WarrantyStockEntryDto } from '../entities/warranty-stock-entry-dto';

@Controller('stock_entry')
export class StockEntryController {
  constructor(
    private readonly aggregate: StockEntryAggregateService,
    private readonly warrantyStockAggregate: WarrantyStockEntryAggregateService,
  ) {}

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
  getPurchaseInvoiceList(
    @Query() query: PurchaseInvoiceListQueryDto,
    @Req() req,
  ) {
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
      req,
    );
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  getStockEntry(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.getStockEntry(uuid, req);
  }

  @Post('v1/delete/:uuid')
  @UseGuards(TokenGuard)
  deleteStockEntry(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.deleteDraft(uuid, req);
  }

  @Post('v1/reset/:uuid')
  @UseGuards(TokenGuard)
  reset(@Param('uuid') uuid, @Req() req) {
    return this.aggregate.resetStockEntry(uuid, req);
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

  @Post('v1/create_warranty_stock')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createWarrantyStock(@Body() body: WarrantyStockEntryDto[], @Req() req) {
    return this.warrantyStockAggregate.createDeliveryNote(body, req);
  }

  @Get('v1/get_warranty_stock/:warrantyClaimUuid')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  retrieveWarrantyStock(@Param() warrantyClaimUuid: string) {
    return this.warrantyStockAggregate.retrieveStockEntry(warrantyClaimUuid);
  }

  @Post('v1/cancel_warranty_stock_entry')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  removeWarrantyStock(@Body() stockVoucherNumber: any, @Req() req) {
    return this.warrantyStockAggregate.removeStockEntry(
      stockVoucherNumber,
      req,
    );
  }
}
