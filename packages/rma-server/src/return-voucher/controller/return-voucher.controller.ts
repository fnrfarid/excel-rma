import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ReturnVoucherService } from '../return-voucher-service/return-voucher.service';
import { TokenGuard } from '../../auth/guards/token.guard';

@Controller('return_voucher')
export class ReturnVoucherController {
  constructor(private readonly returnVoucherService: ReturnVoucherService) {}

  @Get('v1/list')
  @UseGuards(TokenGuard)
  listReturnVoucher(
    @Req() req,
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
  ) {
    return this.returnVoucherService.listReturnVoucher(offset, limit, req);
  }
}
