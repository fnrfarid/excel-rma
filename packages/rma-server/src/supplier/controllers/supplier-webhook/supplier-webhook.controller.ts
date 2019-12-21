import { Controller, Post, Body, Req } from '@nestjs/common';
import { SupplierWebhookInterface } from '../../entity/supplier/supplier-webhook-interface';

@Controller('supplier')
export class SupplierWebhookController {
  constructor() {}

  @Post('webhook/v1/create')
  SupplierCreated(
    @Body() supplierPayload: SupplierWebhookInterface,
    @Req() clientHttpReq,
  ) {}
}
