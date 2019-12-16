import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FrappeWebhookGuard } from '../../guards/frappe-webhook.guard';
import { FrappeBearerTokenWebhookInterface } from '../../entities/token-cache/frappe-bearer-token-webhook.interface';
import { ConnectService } from '../../aggregates/connect/connect.service';

@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Post('v1/token_delete')
  @UseGuards(FrappeWebhookGuard)
  async frappeTokenDelete(@Body('access_token') accessToken: string) {
    await this.connectService.tokenDeleted(accessToken);
  }

  @Post('v1/token_added')
  @UseGuards(FrappeWebhookGuard)
  async frappeTokenAdded(@Body() payload: FrappeBearerTokenWebhookInterface) {
    return await this.connectService.createFrappeBearerToken(payload);
  }
}
