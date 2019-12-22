import {
  Injectable,
  NotImplementedException,
  HttpService,
  InternalServerErrorException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { Observable, from, forkJoin, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { randomBytes } from 'crypto';
import { ServerSettingsService } from '../../entities/server-settings/server-settings.service';
import { ServerSettings } from '../../entities/server-settings/server-settings.entity';
import {
  BEARER_HEADER_VALUE_PREFIX,
  AUTHORIZATION,
  TOKEN_ADD_ENDPOINT,
  TOKEN_DELETE_ENDPOINT,
  CONTENT_TYPE,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
  SUPPLIER_AFTER_INSERT_ENDPOINT,
  SUPPLIER_ON_UPDATE_ENDPOINT,
  SUPPLIER_ON_TRASH_ENDPOINT,
  CUSTOMER_AFTER_INSERT_ENDPOINT,
  CUSTOMER_ON_UPDATE_ENDPOINT,
  CUSTOMER_ON_TRASH_ENDPOINT,
  ITEM_ON_UPDATE_ENDPOINT,
  ITEM_ON_TRASH_ENDPOINT,
  ITEM_AFTER_INSERT_ENDPOINT,
} from '../../../constants/app-strings';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { PLEASE_RUN_SETUP } from '../../../constants/messages';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  getBearerTokenOnTrashWebhookData,
  getBearerTokenAfterInsertWebhookData,
  getSupplierAfterInsertWebhookData,
  getSupplierOnUpdateWebhookData,
  getSupplierOnTrashWebhookData,
  getCustomerAfterInsertWebhookData,
  getCustomerOnUpdateWebhookData,
  getCustomerOnTrashWebhookData,
  getItemAfterInsertWebhookData,
  getItemOnUpdateWebhookData,
  getItemOnTrashWebhookData,
} from '../../../constants/webhook-data';

@Injectable()
export class SettingsService extends AggregateRoot {
  constructor(
    private readonly serverSettingsService: ServerSettingsService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly http: HttpService,
  ) {
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

  async updateFrappeWebhookKey() {
    const settings = await this.serverSettingsService.find();
    if (!settings) throw new NotImplementedException(PLEASE_RUN_SETUP);
    settings.webhookApiKey = this.randomBytes();
    settings.save();
    return settings;
  }

  randomBytes(length: number = 64) {
    return randomBytes(length).toString('hex');
  }

  setupWebhooks() {
    let serverSettings: ServerSettings;
    const headers = {};

    headers[CONTENT_TYPE] = APPLICATION_JSON_CONTENT_TYPE;
    headers[ACCEPT] = APPLICATION_JSON_CONTENT_TYPE;

    return this.find().pipe(
      switchMap(settings => {
        serverSettings = settings;
        return this.clientToken.getClientToken();
      }),
      switchMap(token => {
        headers[AUTHORIZATION] = BEARER_HEADER_VALUE_PREFIX + token.accessToken;
        return forkJoin(
          // Item Webhooks
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getItemAfterInsertWebhookData(
                serverSettings.appURL + ITEM_AFTER_INSERT_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getItemOnUpdateWebhookData(
                serverSettings.appURL + ITEM_ON_UPDATE_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getItemOnTrashWebhookData(
                serverSettings.appURL + ITEM_ON_TRASH_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),

          // Customer Webhooks
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getCustomerAfterInsertWebhookData(
                serverSettings.appURL + CUSTOMER_AFTER_INSERT_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getCustomerOnUpdateWebhookData(
                serverSettings.appURL + CUSTOMER_ON_UPDATE_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getCustomerOnTrashWebhookData(
                serverSettings.appURL + CUSTOMER_ON_TRASH_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),

          // Supplier Webhooks
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getSupplierAfterInsertWebhookData(
                serverSettings.appURL + SUPPLIER_AFTER_INSERT_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getSupplierOnUpdateWebhookData(
                serverSettings.appURL + SUPPLIER_ON_UPDATE_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getSupplierOnTrashWebhookData(
                serverSettings.appURL + SUPPLIER_ON_TRASH_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),

          // OAuth Bearer Token Webhooks
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getBearerTokenAfterInsertWebhookData(
                serverSettings.appURL + TOKEN_ADD_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
          this.http
            .post(
              serverSettings.authServerURL + '/api/resource/Webhook',
              getBearerTokenOnTrashWebhookData(
                serverSettings.appURL + TOKEN_DELETE_ENDPOINT,
                serverSettings.webhookApiKey,
              ),
              { headers },
            )
            .pipe(map(res => res.data)),
        );
      }),
      catchError(error => {
        return throwError(new InternalServerErrorException(error));
      }),
    );
  }
}
