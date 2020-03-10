import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { StockEntryAggregateService } from '../aggregates/stock-entry-aggregate/stock-entry-aggregate.service';
import { StockEntryDto } from '../stock-entry/stock-entry-dto';
import { TokenGuard } from '../../auth/guards/token.guard';

@Controller('stock_entry')
export class StockEntryController {
  constructor(private readonly aggregate: StockEntryAggregateService) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() body: StockEntryDto, @Req() req) {
    return this.aggregate.create(body, req);
  }
}
