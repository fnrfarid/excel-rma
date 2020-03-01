import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { PurchaseOrderWebhookDto } from '../../entity/purchase-order/purchase-order-webhook-dto';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';
import { PurchaseOrder } from '../../entity/purchase-order/purchase-order.entity';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import * as uuidv4 from 'uuid/v4';
import { PURCHASE_ORDER_ALREADY_EXIST } from '../../../constants/messages';
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
export class PurchaseOrderWebhookAggregateService {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
  ) {}

  purchaseOrderCreated(purchaseOrderPayload: PurchaseOrderWebhookDto) {
    return forkJoin({
      purchaseOrder: from(
        this.purchaseOrderService.findOne({
          name: purchaseOrderPayload.name,
        }),
      ),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ purchaseOrder, settings }) => {
        if (purchaseOrder) {
          return throwError(
            new BadRequestException(PURCHASE_ORDER_ALREADY_EXIST),
          );
        }
        const provider = this.mapPurchaseOrder(purchaseOrderPayload);
        provider.created_on = new DateTime(settings.timeZone).toJSDate();
        return this.getUserDetails(purchaseOrderPayload.owner).pipe(
          switchMap(user => {
            provider.created_by = user.full_name;
            this.purchaseOrderService
              .create(provider)
              .then(success => {})
              .catch(error => {});
            return of({});
          }),
        );
      }),
    );
  }

  mapPurchaseOrder(purchaseOrderPayload: PurchaseOrderWebhookDto) {
    const purchaseOrder = new PurchaseOrder();
    Object.assign(purchaseOrder, purchaseOrderPayload);
    purchaseOrder.uuid = uuidv4();
    purchaseOrder.isSynced = true;
    purchaseOrder.status = SUBMITTED_STATUS;
    purchaseOrder.inQueue = false;
    purchaseOrder.submitted = true;
    return purchaseOrder;
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
