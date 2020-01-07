import {
  Controller,
  Post,
  UsePipes,
  Body,
  ValidationPipe,
  Req,
  Param,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { AddSerialNoCommand } from '../../command/add-serial-no/add-serial-no.command';
import { RemoveSerialNoCommand } from '../../command/remove-serial-no/remove-serial-no.command';
import { UpdateSerialNoCommand } from '../../command/update-serial-no/update-serial-no.command';
import { RetrieveSerialNoQuery } from '../../query/get-serial-no/retrieve-serial-no.query';
import { RetrieveSerialNoListQuery } from '../../query/list-serial-no/retrieve-serial-no-list.query';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';
import { SerialNoDto } from '../../entity/serial-no/serial-no-dto';

@Controller('serial_no')
export class SerialNoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() serialNoPayload: SerialNoDto, @Req() req) {
    return this.commandBus.execute(
      new AddSerialNoCommand(serialNoPayload, req),
    );
  }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  remove(@Param('uuid') uuid) {
    return this.commandBus.execute(new RemoveSerialNoCommand(uuid));
  }

  @Get('v1/get/:serial_no')
  @UseGuards(TokenGuard)
  async getSerialNo(@Param('serial_no') serial_no) {
    return await this.queryBus.execute(new RetrieveSerialNoQuery(serial_no));
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  getSerialNoList(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('sort') sort,
    @Req() clientHttpRequest,
  ) {
    if (sort !== 'ASC') {
      sort = 'DESC';
    }
    return this.queryBus.execute(
      new RetrieveSerialNoListQuery(
        offset,
        limit,
        sort,
        search,
        clientHttpRequest,
      ),
    );
  }

  @Post('v1/update')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateSerialNo(@Body() updatePayload: UpdateSerialNoDto) {
    return this.commandBus.execute(new UpdateSerialNoCommand(updatePayload));
  }
}
