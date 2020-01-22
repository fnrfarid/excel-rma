import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import {
  SYSTEM_MANAGER,
  SALES_USER,
  SALES_MANAGER,
} from '../../../constants/app-strings';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { DeliveryNoteAggregateService } from '../../aggregates/delivery-note-aggregate/delivery-note-aggregate.service';

@Controller('delivery_note')
export class DeliveryNoteController {
  constructor(
    private readonly deliveryNoteAggregate: DeliveryNoteAggregateService,
  ) {}

  @Get('v1/list')
  @UseGuards(TokenGuard)
  getDeliveryNote(
    @Req() req,
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('sales_invoice') sales_invoice: string,
  ) {
    return this.deliveryNoteAggregate.listDeliveryNote(
      offset,
      limit,
      req,
      sales_invoice,
    );
  }

  @Get('v1/relay_list_warehouses')
  @Roles(SYSTEM_MANAGER, SALES_MANAGER, SALES_USER)
  @UseGuards(TokenGuard, RoleGuard)
  relayListCompanies(@Query() query) {
    return this.deliveryNoteAggregate.relayListWarehouses(query);
  }
}
