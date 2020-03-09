import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import { PurchaseOrderWebhookDto } from '../../entity/purchase-order/purchase-order-webhook-dto';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';
import { PurchaseOrder } from '../../entity/purchase-order/purchase-order.entity';
import { from, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import * as uuidv4 from 'uuid/v4';
import { DateTime } from 'luxon';
import { PURCHASE_ORDER_ALREADY_EXIST } from '../../../constants/messages';
import {
  SUBMITTED_STATUS,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  APPLICATION_JSON_CONTENT_TYPE,
  ACCEPT,
  CONTENT_TYPE,
} from '../../../constants/app-strings';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import {
  FRAPPE_API_GET_USER_INFO_ENDPOINT,
  MAP_PO_TO_PI_ENDPOINT,
  ERPNEXT_PURCHASE_INVOICE_ENDPOINT,
  FRAPPE_CLIENT_SUBMIT_ENDPOINT,
} from '../../../constants/routes';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
@Injectable()
export class PurchaseOrderWebhookAggregateService {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly settings: SettingsService,
    private readonly http: HttpService,
    private readonly direct: DirectService,
    private readonly errorLog: ErrorLogService,
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
            this.createPurchaseInvoice(purchaseOrderPayload, settings);
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
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settings.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        return this.http
          .get(
            settings.authServerURL + FRAPPE_API_GET_USER_INFO_ENDPOINT + email,
            { headers },
          )
          .pipe(map(res => res.data.data));
      }),
    );
  }

  createPurchaseInvoice(
    order: PurchaseOrderWebhookDto,
    settings: ServerSettings,
  ) {
    return this.direct
      .getUserAccessToken(order.owner)
      .pipe(
        map(token => {
          return {
            [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
          };
        }),
        catchError(error => this.clientToken.getServiceAccountApiHeaders()),
        switchMap(headers => {
          return this.http
            .get(settings.authServerURL + MAP_PO_TO_PI_ENDPOINT, {
              params: { source_name: order.name },
              headers,
            })
            .pipe(
              map(res => res.data),
              switchMap(invoice => {
                headers[ACCEPT] = APPLICATION_JSON_CONTENT_TYPE;
                headers[CONTENT_TYPE] = APPLICATION_JSON_CONTENT_TYPE;
                return this.http
                  .post(
                    settings.authServerURL + ERPNEXT_PURCHASE_INVOICE_ENDPOINT,
                    invoice.message,
                    { headers },
                  )
                  .pipe(map(res => res.data));
              }),
              switchMap(invoice => {
                return this.http.post(
                  settings.authServerURL + FRAPPE_CLIENT_SUBMIT_ENDPOINT,
                  { doc: invoice.data },
                  { headers },
                );
              }),
            );
        }),
      )
      .subscribe({
        next: invoice => {},
        error: error => {
          const errorJson = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
          );
          this.errorLog.createErrorLog(errorJson);
        },
      });
  }
}
