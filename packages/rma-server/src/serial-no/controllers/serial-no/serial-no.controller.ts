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
import { RetrieveSerialNoQuery } from '../../query/get-serial-no/retrieve-serial-no.query';
import { RetrieveSerialNoListQuery } from '../../query/list-serial-no/retrieve-serial-no-list.query';
import {
  ValidateSerialsDto,
  ValidateReturnSerialsDto,
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
import { RetrieveDirectSerialNoQuery } from '../../../serial-no/query/get-direct-serial-no/retrieve-direct-serial-no.query';

@Controller('serial_no')
export class SerialNoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly serialAggregateService: SerialNoAggregateService,
  ) {}

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
    @Query('sort') sort,
    @Query('query') query,
  ) {
    if (sort !== 'ASC') {
      sort = 'DESC';
    }
    return this.queryBus.execute(
      new RetrieveSerialNoListQuery(offset, limit, sort, query),
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
    @Query('purchase_invoice_name') purchase_invoice_name,
    @Req() clientHttpRequest,
  ) {
    if (!purchase_invoice_name) {
      throw new BadRequestException('Purchase Invoice Name is mandatory.');
    }

    return await this.serialAggregateService.getPurchaseInvoiceDeliveredSerials(
      purchase_invoice_name,
      search,
      +offset,
      +limit,
      clientHttpRequest,
    );
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

  @Post('v1/validate_return_serials')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('file'))
  validateReturnSerialNo(
    @Body() body: ValidateReturnSerialsDto,
    @UploadedFile('file') file,
  ) {
    if (file) {
      return this.serialAggregateService
        .validateBulkReturnSerialFile(file)
        .toPromise();
    }
    return this.serialAggregateService.validateReturnSerials(body).toPromise();
  }

  @Get('v1/get_direct_serial/:serial_no')
  @UseGuards(TokenGuard)
  async getDirectSerialNo(@Param('serial_no') serial_no) {
    return await this.queryBus.execute(
      new RetrieveDirectSerialNoQuery(serial_no),
    );
  }
}
