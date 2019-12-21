import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { SupplierWebhookInterface } from '../../entity/supplier/supplier-webhook-interface';
import { SupplierWebhookAggregateService } from '../../aggregates/supplier-webhook-aggregate/supplier-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

@Controller('supplier')
export class SupplierWebhookController {
  constructor(
    private readonly supplierWebhookAggregate: SupplierWebhookAggregateService,
  ) {}

  @Post('webhook/v1/create')
  @UseGuards(FrappeWebhookGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  SupplierCreated(@Body() supplierPayload: SupplierWebhookInterface) {
    return this.supplierWebhookAggregate.supplierCreated(supplierPayload);
  }

  @Post('webhook/v1/update')
  @UseGuards(FrappeWebhookGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  SupplierUpdated(@Body() supplierPayload: SupplierWebhookInterface) {
    return this.supplierWebhookAggregate.supplierUpdated(supplierPayload);
  }

  @Post('webhook/v1/delete')
  @UseGuards(FrappeWebhookGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  SupplierDeleted(@Body() supplierPayload: SupplierWebhookInterface) {
    return this.supplierWebhookAggregate.supplierDeleted(supplierPayload);
  }
}
