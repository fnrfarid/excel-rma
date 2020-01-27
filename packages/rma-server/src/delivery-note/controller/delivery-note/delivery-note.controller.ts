import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  Param,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import {
  SYSTEM_MANAGER,
  SALES_USER,
  SALES_MANAGER,
} from '../../../constants/app-strings';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { DeliveryNoteAggregateService } from '../../aggregates/delivery-note-aggregate/delivery-note-aggregate.service';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { RetriveDeliveryNoteQuery } from '../../queries/retrive-delivery-note/retrive-delivery-note.query';
import { UpdateDeliveryNoteDto } from '../../entity/delivery-note-service/update-delivery-note.dto';
import { UpdateDeliveryNoteCommand } from '../../commands/update-note/update-delivery-note.command';
@Controller('delivery_note')
export class DeliveryNoteController {
  constructor(
    private readonly deliveryNoteAggregate: DeliveryNoteAggregateService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
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
  @UseGuards(TokenGuard)
  @Get('v1/get_delivery_note/:uuid')
  getNote(@Param('uuid') uuid: string) {
    return this.queryBus.execute(new RetriveDeliveryNoteQuery(uuid));
  }
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('v1/update_delivery_note')
  updateDeliveryNote(@Body() payload: UpdateDeliveryNoteDto) {
    return this.commandBus.execute(new UpdateDeliveryNoteCommand(payload));
  }
}
