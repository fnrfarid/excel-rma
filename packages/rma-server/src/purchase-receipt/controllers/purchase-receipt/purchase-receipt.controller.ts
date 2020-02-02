import {
  Controller,
  Post,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { PurchaseReceiptDto } from '../../entity/purchase-receipt-dto';
import { PurchaseReceiptAggregateService } from '../../aggregates/purchase-receipt-aggregate/purchase-receipt-aggregate.service';

@Controller('purchase_receipt')
export class PurchaseReceiptController {
  constructor(
    private readonly purchaseReceiptAggregateService: PurchaseReceiptAggregateService,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() purchaseReceiptPayload: PurchaseReceiptDto, @Req() req) {
    return this.purchaseReceiptAggregateService.addPurchaseInvoice(
      purchaseReceiptPayload,
      req,
    );
  }
}
