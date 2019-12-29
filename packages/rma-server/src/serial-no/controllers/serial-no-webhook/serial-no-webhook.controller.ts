import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';
import { SerialNoWebhookAggregateService } from '../../aggregates/serial-no-webhook-aggregate/serial-no-webhook-aggregate.service';
import { SerialNoWebhookInterface } from '../../entity/serial-no/serial-no-webhook-interface';

@Controller('serial_no')
export class SerialNoWebhookController {
  constructor(
    private readonly serialNoWebhookGuard: SerialNoWebhookAggregateService,
  ) {}

  @Post('webhook/v1/create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  serialNoCreated(@Body() serialNoPayload: SerialNoWebhookInterface) {
    return this.serialNoWebhookGuard.serialNoCreated(serialNoPayload);
  }

  @Post('webhook/v1/update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(FrappeWebhookGuard)
  serialNoUpdated(@Body() serialNoPayload: SerialNoWebhookInterface) {
    return this.serialNoWebhookGuard.serialNoUpdated(serialNoPayload);
  }
}
