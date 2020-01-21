import {
  Controller,
  All,
  Req,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CommandService } from '../../aggregates/command/command.service';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_MANAGER } from '../../../constants/app-strings';
import { RoleGuard } from '../../../auth/guards/role.guard';

@Controller('command')
export class CommandController {
  constructor(private readonly command: CommandService) {}

  @All('bot/*')
  @Roles(SYSTEM_MANAGER)
  @UseGuards(TokenGuard, RoleGuard)
  makeBotRequest(@Param() params, @Query() query, @Body() payload, @Req() req) {
    return this.command.makeRequest(
      req.method,
      params,
      undefined,
      query,
      payload,
      true,
    );
  }

  @All('user/*')
  @UseGuards(TokenGuard)
  makeUserRequest(
    @Param() params,
    @Query() query,
    @Body() payload,
    @Req() req,
  ) {
    const accessToken = req.token && req.token.accessToken;
    return this.command.makeRequest(
      req.method,
      params,
      accessToken,
      query,
      payload,
    );
  }
}
