import {
  Injectable,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { Observable, from } from 'rxjs';
import { ServerSettingsService } from '../../entities/server-settings/server-settings.service';
import { ServerSettings } from '../../entities/server-settings/server-settings.entity';
import {
  BEARER_HEADER_VALUE_PREFIX,
  AUTHORIZATION,
} from '../../../constants/app-strings';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import {
  PLEASE_RUN_SETUP,
  SETUP_ALREADY_COMPLETE,
} from '../../../constants/messages';
import { randomBytes } from 'crypto';

@Injectable()
export class SettingsService extends AggregateRoot {
  constructor(private readonly serverSettingsService: ServerSettingsService) {
    super();
  }

  find(): Observable<ServerSettings> {
    const settings = this.serverSettingsService.find();
    return from(settings);
  }

  update(query, params) {
    return from(this.serverSettingsService.update(query, params));
  }

  getAuthorizationHeaders(token: TokenCache) {
    const headers: any = {};
    headers[AUTHORIZATION] = BEARER_HEADER_VALUE_PREFIX + token.accessToken;
    return headers;
  }

  async setupFrappeWebhookKey() {
    const settings = await this.serverSettingsService.find();
    if (!settings) throw new NotImplementedException(PLEASE_RUN_SETUP);
    if (settings.webhookApiKey)
      throw new BadRequestException(SETUP_ALREADY_COMPLETE);
    settings.webhookApiKey = this.randomBytes32();
    settings.save();
    return settings;
  }

  async updateFrappeWebhookKey() {
    const settings = await this.serverSettingsService.find();
    if (!settings) throw new NotImplementedException(PLEASE_RUN_SETUP);
    settings.webhookApiKey = this.randomBytes32();
    settings.save();
    return settings;
  }

  randomBytes32() {
    return randomBytes(32).toString('hex');
  }
}
