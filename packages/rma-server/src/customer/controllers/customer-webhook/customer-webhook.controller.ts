import { Controller, Post, Body, Req } from '@nestjs/common';
import { CustomerWebhookInterface } from '../../entity/customer/customer-webhook-interface';

@Controller('customer')
export class CustomerWebhookController {
  constructor() {}

  @Post('webhook/v1/create')
  customerCreated(
    @Body() customerPayload: CustomerWebhookInterface,
    @Req() clientHttpReq,
  ) {}
}
