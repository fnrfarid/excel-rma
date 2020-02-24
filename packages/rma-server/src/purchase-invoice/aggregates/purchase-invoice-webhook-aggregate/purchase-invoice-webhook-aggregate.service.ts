import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { PurchaseInvoiceWebhookDto } from '../../entity/purchase-invoice/purchase-invoice-webhook-dto';
import { PurchaseInvoiceService } from '../../entity/purchase-invoice/purchase-invoice.service';
import { PurchaseInvoice } from '../../entity/purchase-invoice/purchase-invoice.entity';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import * as uuidv4 from 'uuid/v4';
import { PURCHASE_INVOICE_ALREADY_EXIST } from '../../../constants/messages';
import {
  SUBMITTED_STATUS,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { FRAPPE_API_GET_USER_INFO_ENDPOINT } from '../../../constants/routes';
import { DateTime } from 'luxon';
@Injectable()
export class PurchaseInvoiceWebhookAggregateService {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
  ) {}

  purchaseInvoiceCreated(purchaseInvoicePayload: PurchaseInvoiceWebhookDto) {
    return forkJoin({
      purchaseInvoice: from(
        this.purchaseInvoiceService.findOne({
          name: purchaseInvoicePayload.name,
        }),
      ),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ purchaseInvoice, settings }) => {
        if (purchaseInvoice) {
          return throwError(
            new BadRequestException(PURCHASE_INVOICE_ALREADY_EXIST),
          );
        }
        const provider = this.mapPurchaseInvoice(purchaseInvoicePayload);
        provider.created_on = new DateTime(settings.timeZone).toJSDate();
        return this.getUserDetails(purchaseInvoicePayload.owner).pipe(
          switchMap(user => {
            provider.created_by = user.full_name;
            this.purchaseInvoiceService
              .create(provider)
              .then(success => {})
              .catch(error => {});
            return of({});
          }),
        );
      }),
    );
  }

  mapPurchaseInvoice(purchaseInvoicePayload: PurchaseInvoiceWebhookDto) {
    const purchaseInvoice = new PurchaseInvoice();
    Object.assign(purchaseInvoice, purchaseInvoicePayload);
    purchaseInvoice.uuid = uuidv4();
    purchaseInvoice.isSynced = true;
    purchaseInvoice.status = SUBMITTED_STATUS;
    purchaseInvoice.inQueue = false;
    purchaseInvoice.submitted = true;
    return purchaseInvoice;
  }

  getUserDetails(email: string) {
    return forkJoin({
      token: this.clientToken.getClientToken(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ token, settings }) => {
        return this.http
          .get(
            settings.authServerURL + FRAPPE_API_GET_USER_INFO_ENDPOINT + email,
            {
              headers: {
                [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
              },
            },
          )
          .pipe(map(res => res.data.data));
      }),
    );
  }
}
