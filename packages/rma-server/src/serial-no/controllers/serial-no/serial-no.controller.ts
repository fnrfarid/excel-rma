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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { AddSerialNoCommand } from '../../command/add-serial-no/add-serial-no.command';
import { RemoveSerialNoCommand } from '../../command/remove-serial-no/remove-serial-no.command';
import { UpdateSerialNoCommand } from '../../command/update-serial-no/update-serial-no.command';
import { RetrieveSerialNoQuery } from '../../query/get-serial-no/retrieve-serial-no.query';
import { RetrieveSerialNoListQuery } from '../../query/list-serial-no/retrieve-serial-no-list.query';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';
import {
  SerialNoDto,
  ValidateSerialsDto,
} from '../../entity/serial-no/serial-no-dto';
import { AssignSerialDto } from '../../entity/serial-no/assign-serial-dto';
import { AssignSerialNoCommand } from '../../command/assign-serial-no/assign-serial-no.command';
import { ValidateSerialsQuery } from '../../query/validate-serial/validate-serial.query';
import { RetrieveSalesInvoiceDeliveredSerialNoQuery } from '../../query/retrieve-sales-invoice-delivered-serial-no/retrieve-sales-invoice-delivered-serial-no.query'; // eslint-disable-line
import {
  DELIVERY_NOTE,
  PURCHASE_RECEIPT,
} from '../../../constants/app-strings';
import { SerialNoAggregateService } from '../../aggregates/serial-no-aggregate/serial-no-aggregate.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('serial_no')
export class SerialNoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly serialAggregateService: SerialNoAggregateService,
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

  @Get('v1/get_sales_invoice_delivered_serials')
  @UseGuards(TokenGuard)
  getSalesInvoiceDeliveredSerials(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('find') find,
    @Req() clientHttpRequest,
  ) {
    return this.queryBus.execute(
      new RetrieveSalesInvoiceDeliveredSerialNoQuery(
        offset,
        limit,
        search,
        find,
        clientHttpRequest,
      ),
    );
  }

  @Post('v1/get_purchase_invoice_delivered_serials')
  @UseGuards(TokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  async getPurchaseInvoiceDeliveredSerials(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @UploadedFile('file') file,
    @Req() clientHttpRequest,
  ) {
    if (!file || !file.buffer || file.buffer.toString()) {
      throw new BadRequestException('Invalid File');
    }

    return await this.serialAggregateService.getPurchaseInvoiceDeliveredSerials(
      JSON.parse(file.buffer),
      search,
      +offset,
      +limit,
      clientHttpRequest,
    );
  }

  @Post('v1/update')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateSerialNo(@Body() updatePayload: UpdateSerialNoDto) {
    return this.commandBus.execute(new UpdateSerialNoCommand(updatePayload));
  }

  @Post('v1/assign')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  assignSerialNo(
    @Body() assignSerialPayload: AssignSerialDto,
    @Req() clientHttpRequest,
  ) {
    return this.commandBus.execute(
      new AssignSerialNoCommand(assignSerialPayload, clientHttpRequest),
    );
  }

  @Post('v1/validate')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('file'))
  validateSerialNo(
    @Req() clientHttpRequest,
    @Body() body: ValidateSerialsDto,
    @UploadedFile('file') file,
  ) {
    body.validateFor =
      body.validateFor === PURCHASE_RECEIPT ? body.validateFor : DELIVERY_NOTE;
    return this.queryBus.execute(
      new ValidateSerialsQuery(body, clientHttpRequest, file),
    );
  }
}
