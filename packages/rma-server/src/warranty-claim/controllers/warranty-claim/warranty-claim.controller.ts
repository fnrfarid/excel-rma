import {
  Controller,
  Post,
  UseGuards,
  UsePipes,
  Body,
  ValidationPipe,
  Req,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { WarrantyClaimDto } from '../../entity/warranty-claim/warranty-claim-dto';
import { AddWarrantyClaimCommand } from '../../command/add-warranty-claim/add-warranty-claim.command';
import { RemoveWarrantyClaimCommand } from '../../command/remove-warranty-claim/remove-warranty-claim.command';
import { UpdateWarrantyClaimCommand } from '../../command/update-warranty-claim/update-warranty-claim.command';
import { RetrieveWarrantyClaimQuery } from '../../query/get-warranty-claim/retrieve-warranty-claim.query';
import { RetrieveWarrantyClaimListQuery } from '../../query/list-warranty-claim/retrieve-warranty-claim-list.query';
import { UpdateWarrantyClaimDto } from '../../entity/warranty-claim/update-warranty-claim-dto';

@Controller('warranty_claim')
export class WarrantyClaimController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() warrantyclaimPayload: WarrantyClaimDto, @Req() req) {
    return this.commandBus.execute(
      new AddWarrantyClaimCommand(warrantyclaimPayload, req),
    );
  }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  remove(@Param('uuid') uuid: string) {
    return this.commandBus.execute(new RemoveWarrantyClaimCommand(uuid));
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getClient(@Param('uuid') uuid: string, @Req() req) {
    return await this.queryBus.execute(
      new RetrieveWarrantyClaimQuery(uuid, req),
    );
  }

  @Get('v1/list')
  @UseGuards(TokenGuard)
  getClientList(
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
      new RetrieveWarrantyClaimListQuery(
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
  updateClient(@Body() updatePayload: UpdateWarrantyClaimDto) {
    return this.commandBus.execute(
      new UpdateWarrantyClaimCommand(updatePayload),
    );
  }
}
