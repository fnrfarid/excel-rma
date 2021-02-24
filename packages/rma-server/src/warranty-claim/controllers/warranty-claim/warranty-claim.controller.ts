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
import { ResetWarrantyClaimCommand } from '../../command/reset-warranty-claim/reset-warranty-claim.command';
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
import { BulkWarrantyClaimDto } from '../../entity/warranty-claim/bulk-warranty-claim-dto';

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

  @Post('v1/create_bulk')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createBulk(
    @Body() warrantyClaimPayload: BulkWarrantyClaimDto,
    @Req() req,
  ) {
    return await this.commandBus.execute(
      new AddWarrantyClaimCommand(warrantyClaimPayload, req),
    );
  }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  async remove(@Param('uuid') uuid: string) {
    return await this.commandBus.execute(new RemoveWarrantyClaimCommand(uuid));
  }

  @Post('v1/reset/:uuid')
  @UseGuards(TokenGuard)
  async reset(@Param('uuid') uuid: string) {
    return await this.commandBus.execute(new ResetWarrantyClaimCommand(uuid));
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
  getWarrantyClaimsList(
    @Query() query: WarrantyClaimsListQueryDto,
    @Req() req,
  ) {
    const { offset, limit, sort, filter_query, territories } = query;
    let filter;
    let territory;
    try {
      filter = JSON.parse(filter_query);
      territory = JSON.parse(territories);
    } catch {
      filter;
      territory = territories;
    }
    return this.queryBus.execute(
      new RetrieveWarrantyClaimListQuery(
        offset,
        limit,
        sort,
        filter,
        territory,
        req,
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
