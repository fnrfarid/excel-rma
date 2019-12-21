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
import { AddCustomerCommand } from '../../command/add-customer/add-customer.command';
import { RemoveCustomerCommand } from '../../command/remove-customer/remove-customer.command';
import { UpdateCustomerCommand } from '../../command/update-customer/update-customer.command';
import { Customer } from '../../entity/customer/customer.entity';
import { RetrieveCustomerQuery } from '../../query/get-customer/retrieve-customer.query';
import { RetrieveCustomerListQuery } from '../../query/list-customer/retrieve-customer-list.query';
import { CustomerDto } from '../../../customer/entity/customer/customer-dto';

@Controller('customer')
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('v1/create')
  @UseGuards(TokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() customerPayload: CustomerDto, @Req() req) {
    return this.commandBus.execute(
      new AddCustomerCommand(customerPayload, req),
    );
  }

  @Post('v1/remove/:uuid')
  @UseGuards(TokenGuard)
  remove(@Param('uuid') uuid) {
    return this.commandBus.execute(new RemoveCustomerCommand(uuid));
  }

  @Get('v1/get/:uuid')
  @UseGuards(TokenGuard)
  async getClient(@Param('uuid') uuid, @Req() req) {
    return await this.queryBus.execute(new RetrieveCustomerQuery(uuid, req));
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
      new RetrieveCustomerListQuery(
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
  updateClient(@Body() updatePayload: Customer) {
    return this.commandBus.execute(new UpdateCustomerCommand(updatePayload));
  }
}
