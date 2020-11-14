import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ItemBundleWebhookInterface,
  ItemWebhookInterface,
} from '../../entity/item/item-webhook-interface';
import { ItemWebhookAggregateService } from '../../aggregates/item-webhook-aggregate/item-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

@Controller('item')
export class ItemWebhookController {
  constructor(
    private readonly itemWebhookAggregate: ItemWebhookAggregateService,
  ) {}

  @Post('webhook/v1/create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemCreated(@Body() itemPayload: ItemWebhookInterface) {
    return this.itemWebhookAggregate.itemCreated(itemPayload);
  }

  @Post('webhook/v1/bundle')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  bundleUpdated(@Body() bundlePayload: ItemBundleWebhookInterface) {
    return this.itemWebhookAggregate.bundleUpdated(bundlePayload);
  }

  @Post('webhook/v1/update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemUpdated(@Body() itemPayload: ItemWebhookInterface) {
    return this.itemWebhookAggregate.itemUpdated(itemPayload);
  }

  @Post('webhook/v1/delete')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  itemDeleted(@Body() itemPayload: ItemWebhookInterface) {
    return this.itemWebhookAggregate.itemDeleted(itemPayload);
  }
}
