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
} from '@nestjs/common';
import { StockEntryAggregateService } from '../aggregates/stock-entry-aggregate/stock-entry-aggregate.service';
import { StockEntryDto } from '../stock-entry/stock-entry-dto';
import { TokenGuard } from '../../auth/guards/token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { throwError } from 'rxjs';
import { INVALID_FILE } from '../../constants/app-strings';

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
}
