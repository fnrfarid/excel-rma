import {
  Controller,
  Get,
  UsePipes,
  ValidationPipe,
  Body,
  Post,
  UseGuards,
} from '@nestjs/common';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ServerSettingsDto } from '../../../system-settings/entities/server-settings/server-setting.dto';
import { SYSTEM_MANAGER } from '../../../constants/app-strings';
import { TokenGuard } from '../../../auth/guards/token.guard';
import { RoleGuard } from '../../../auth/guards/role.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SettingsService } from '../../aggregates/settings/settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('v1/get')
  @Roles(SYSTEM_MANAGER)
  @UseGuards(TokenGuard, RoleGuard)
  async getSettings() {
    return await this.settingsService.find();
  }

  @Post('v1/update')
  @Roles(SYSTEM_MANAGER)
  @UseGuards(TokenGuard, RoleGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async updateSettings(@Body() payload: ServerSettingsDto) {
    return from(this.settingsService.find()).pipe(
      switchMap(settings => {
        return this.settingsService.update({ uuid: settings.uuid }, payload);
      }),
    );
  }

  @Post('v1/update_webhook_key')
  @Roles(SYSTEM_MANAGER)
  @UseGuards(TokenGuard, RoleGuard)
  updateFrappeServerApi() {
    return this.settingsService.updateFrappeWebhookKey();
  }

  @Post('v1/setup_webhooks')
  @Roles(SYSTEM_MANAGER)
  @UseGuards(TokenGuard, RoleGuard)
  setupWebhooks() {
    return this.settingsService.setupWebhooks();
  }
}
