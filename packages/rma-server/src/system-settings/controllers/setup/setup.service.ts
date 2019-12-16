import { Injectable, HttpService } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { settingsAlreadyExists } from '../../../constants/exceptions';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import {
  PROFILE_ENDPOINT,
  AUTH_ENDPOINT,
  TOKEN_ENDPOINT,
  REVOKE_ENDPOINT,
  SCOPE,
} from '../../../constants/app-strings';

@Injectable()
export class SetupService {
  constructor(
    protected readonly serverSettingsService: ServerSettingsService,
    protected readonly http: HttpService,
  ) {}

  async setup(params) {
    if (await this.serverSettingsService.count()) {
      throw settingsAlreadyExists;
    }

    const settings = new ServerSettings();
    Object.assign(settings, params);
    settings.profileURL = settings.authServerURL + PROFILE_ENDPOINT;
    settings.authorizationURL = settings.authServerURL + AUTH_ENDPOINT;
    settings.tokenURL = settings.authServerURL + TOKEN_ENDPOINT;
    settings.revocationURL = settings.authServerURL + REVOKE_ENDPOINT;
    settings.scope = SCOPE.split(' ');
    // settings.frontendCallbackURLs = [settings.appURL];
    // settings.backendCallbackURLs = [settings.appURL];

    settings.webhookApiKey = randomBytes(64).toString('hex');

    return await settings.save();
  }

  async getInfo() {
    const info = await this.serverSettingsService.find();
    if (info) {
      info._id = undefined;
      info.serviceAccountUser = undefined;
      info.serviceAccountSecret = undefined;
      info.webhookApiKey = undefined;
    }
    return info;
  }
}
