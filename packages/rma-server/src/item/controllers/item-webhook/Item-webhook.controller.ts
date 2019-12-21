import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ItemWebhookInterface } from '../../entity/item/item-webhook-interface';
// import { ItemWebhookAggregateService } from '../../aggregates/item-webhook-aggregate/item-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

@Controller('Item')
export class ItemWebhookController {
  constructor() // private readonly itemWebhookAggregate: ItemWebhookAggregateService,
  {}

  @Post('webhook/v1/create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemCreated(@Body() itemPayload: ItemWebhookInterface) {}

  @Post('webhook/v1/update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemUpdated(@Body() itemPayload: ItemWebhookInterface) {}

  @Post('webhook/v1/delete')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemDeleted(@Body() itemPayload: ItemWebhookInterface) {}
}
