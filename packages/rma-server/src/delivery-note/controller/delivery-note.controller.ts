import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { DeliveryNoteService } from '../delivery-note-service/delivery-note.service';
import { TokenGuard } from '../../auth/guards/token.guard';

@Controller('delivery_note')
export class DeliveryNoteController {
  constructor(private readonly deliveryNoteService: DeliveryNoteService) {}

  @Get('v1/list')
  @UseGuards(TokenGuard)
  getDeliveryNote(
    @Req() req,
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
  ) {
    return this.deliveryNoteService.listDeliveryNote(offset, limit, req);
  }
}
