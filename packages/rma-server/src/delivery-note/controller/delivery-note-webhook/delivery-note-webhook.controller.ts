import {
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';
import { DeliveryNoteWebhookDto } from '../../../delivery-note/entity/delivery-note-service/delivery-note-webhook.dto';
import { DeliveryNoteWebhookAggregateService } from '../../../delivery-note/aggregates/delivery-note-webhook-aggregate/delivery-note-webhook-aggregate.service';

@Controller('delivery_note')
export class DeliveryNoteWebhookController {
  constructor(
    private readonly deliveryNoteAggregateService: DeliveryNoteWebhookAggregateService,
  ) { }

  @Post('webhook/v1/create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  createdDeliveryNote(@Body() deliveryNotePayload: DeliveryNoteWebhookDto) {
    return this.deliveryNoteAggregateService.createdDeliveryNote(
      deliveryNotePayload,
    );
  }

  @Post('webhook/v1/update')
  @UseGuards(FrappeWebhookGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updatedDeliveryNote(@Body() deliveryNotePayload: DeliveryNoteWebhookDto) {
    console.log("hahha");

    return 'update coming soon';
  }

  @Post('webhook/v1/delete')
  @UseGuards(FrappeWebhookGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deletedDeliveryNote(@Body() deliveryNotePayload: DeliveryNoteWebhookDto) {
    console.log(deliveryNotePayload)
    return "coming soon"
  }

}
