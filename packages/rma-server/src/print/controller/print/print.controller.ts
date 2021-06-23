import {
  Controller,
  All,
  Res,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { DeliveryChalanDto } from '../../entities/print/print.dto';
import { PrintAggregateService } from '../../aggregates/print-aggregate/print-aggregate.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { WarrantyClaimDto } from '../../../warranty-claim/entity/warranty-claim/warranty-claim-dto';

@Controller('print')
export class PrintController {
  constructor(private readonly aggregate: PrintAggregateService) {}

  @All('v1/delivery_invoice')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('file'))
  getDeliveryChalan(@Req() req, @Res() res, @UploadedFile('file') file) {
    const body: DeliveryChalanDto = JSON.parse(file.buffer);
    return this.aggregate.getDeliveryChalan(body, res, req);
  }

  @All('v1/service_invoice')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('file'))
  printWarrantyInvoice(@Req() req, @UploadedFile('file') file) {
    const body: WarrantyClaimDto = JSON.parse(file.buffer);
    return this.aggregate.createFrappePrint(req, body);
  }
}
