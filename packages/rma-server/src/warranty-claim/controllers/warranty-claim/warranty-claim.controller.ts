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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { APPLICATION_JSON_CONTENT_TYPE } from '../../../constants/app-strings';
import { FILE_NOT_FOUND, INVALID_FILE } from '../../../constants/app-strings';
import { CreateBulkClaimsCommand } from '../../command/create-bulk-claims/create-bulk-claims.command';
import { WarrantyClaimsListQueryDto } from '../../../constants/listing-dto/warranty-claims-list-query';
import { StatusHistoryDto } from '../../entity/warranty-claim/status-history-dto';
import { AddStatusHistoryCommand } from '../../command/add-status-history/add-status-history.command';
import { RemoveStatusHistoryCommand } from '../../command/remove-status-history/remove-status-history.command';

@Controller('warranty_claim')
export class WarrantyClaimController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() warrantyClaimPayload: WarrantyClaimDto, @Req() req) {
    return await this.commandBus.execute(
      new AddWarrantyClaimCommand(warrantyClaimPayload, req),
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
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  getWarrantyClaimsList(@Query() query: WarrantyClaimsListQueryDto) {
    const { offset, limit, sort, filter_query } = query;
    let filter;
    try {
      filter = JSON.parse(filter_query);
    } catch {
      filter;
    }
    return this.queryBus.execute(
      new RetrieveWarrantyClaimListQuery(offset, limit, sort, filter),
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

  @Post('v1/create_bulk_claims')
  @UseGuards(TokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  createBulkClaims(@UploadedFile('file') file, @Req() req) {
    if (!file) throw new BadRequestException(FILE_NOT_FOUND);
    if (file.mimetype !== APPLICATION_JSON_CONTENT_TYPE) {
      throw new BadRequestException(INVALID_FILE);
    }
    return this.commandBus.execute(new CreateBulkClaimsCommand(file, req));
  }

  @Post('v1/add_status_history')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addStatusHistory(
    @Body() statusHistoryPayload: StatusHistoryDto,
    @Req() clientHttpRequest,
  ) {
    return this.commandBus.execute(
      new AddStatusHistoryCommand(statusHistoryPayload, clientHttpRequest),
    );
  }

  @Post('v1/remove_status_history')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  removeStatusHistory(@Body() uuid: string) {
    return this.commandBus.execute(new RemoveStatusHistoryCommand(uuid));
  }
}
