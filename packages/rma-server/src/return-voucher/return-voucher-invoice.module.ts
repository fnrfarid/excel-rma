import { Module, HttpModule } from '@nestjs/common';
import { ReturnVoucherController } from './controller/return-voucher.controller';
import { ReturnVoucherService } from './return-voucher-service/return-voucher.service';
@Module({
  imports: [HttpModule],
  controllers: [ReturnVoucherController],
  providers: [ReturnVoucherService],
  exports: [],
})
export class ReturnVoucherModule {}
