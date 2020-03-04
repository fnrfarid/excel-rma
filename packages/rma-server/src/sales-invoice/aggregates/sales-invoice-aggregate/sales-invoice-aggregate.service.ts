import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  HttpService,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SalesInvoiceDto } from '../../entity/sales-invoice/sales-invoice-dto';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceAddedEvent } from '../../event/sales-invoice-added/sales-invoice-added.event';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoiceRemovedEvent } from '../../event/sales-invoice-removed/sales-invoice-removed.event';
import { SalesInvoiceUpdatedEvent } from '../../event/sales-invoice-updated/sales-invoice-updated.event';
import { SalesInvoiceUpdateDto } from '../../entity/sales-invoice/sales-invoice-update-dto';
import { SALES_INVOICE_CANNOT_BE_UPDATED } from '../../../constants/messages';
import { SalesInvoiceSubmittedEvent } from '../../event/sales-invoice-submitted/sales-invoice-submitted.event';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import {
  switchMap,
  map,
  catchError,
  concatMap,
  toArray,
  mergeMap,
  retry,
} from 'rxjs/operators';
import { throwError, of, from } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  DRAFT_STATUS,
  VALIDATE_AUTH_STRING,
} from '../../../constants/app-strings';
import { ACCEPT } from '../../../constants/app-strings';
import { APP_WWW_FORM_URLENCODED } from '../../../constants/app-strings';
import {
  FRAPPE_API_SALES_INVOICE_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
  LIST_CREDIT_NOTE_ENDPOINT,
  FRAPPE_CLIENT_CANCEL,
} from '../../../constants/routes';
import { SalesInvoicePoliciesService } from '../../../sales-invoice/policies/sales-invoice-policies/sales-invoice-policies.service';
import { CreateSalesReturnDto } from '../../entity/sales-invoice/sales-return-dto';
import { DeliveryNote } from '../../../delivery-note/entity/delivery-note-service/delivery-note.entity';
import {
  CreateDeliveryNoteInterface,
  CreateDeliveryNoteItemInterface,
} from '../../../delivery-note/entity/delivery-note-service/create-delivery-note-interface';
import { DeliveryNoteWebhookDto } from '../../../delivery-note/entity/delivery-note-service/delivery-note-webhook.dto';
import { DeliveryNoteService } from '../../../delivery-note/entity/delivery-note-service/delivery-note.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { DateTime } from 'luxon';
import { SalesInvoiceCanceledEvent } from '../../event/sales-invoice-canceled/sales-invoice-canceled.event';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';

@Injectable()
export class SalesInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly validateSalesInvoicePolicy: SalesInvoicePoliciesService,
    private readonly deliveryNoteService: DeliveryNoteService,
    private readonly errorLogService: ErrorLogService,
    private readonly tokenService: DirectService,
  ) {
    super();
  }

  addSalesInvoice(salesInvoicePayload: SalesInvoiceDto, clientHttpRequest) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        return this.validateSalesInvoicePolicy
          .validateCustomer(salesInvoicePayload)
          .pipe(
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateItems(
                salesInvoicePayload.items,
              );
            }),
            switchMap(() => {
              const salesInvoice = new SalesInvoice();
              Object.assign(salesInvoice, salesInvoicePayload);
              salesInvoice.createdByEmail = clientHttpRequest.token.email;
              salesInvoice.createdBy = clientHttpRequest.token.fullName;
              salesInvoice.uuid = uuidv4();
              salesInvoice.created_on = new DateTime(
                settings.timeZone,
              ).toJSDate();
              salesInvoice.isSynced = false;
              salesInvoice.inQueue = false;
              this.apply(
                new SalesInvoiceAddedEvent(salesInvoice, clientHttpRequest),
              );
              return of({});
            }),
          );
      }),
    );
  }

  async retrieveSalesInvoice(uuid: string, req) {
    const provider = await this.salesInvoiceService.findOne({ uuid });
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getSalesInvoiceList(offset, limit, sort, filter_query?) {
    return await this.salesInvoiceService.list(
      offset,
      limit,
      sort,
      filter_query,
    );
  }

  async remove(uuid: string) {
    const found = await this.salesInvoiceService.findOne({ uuid });
    if (!found) {
      throw new NotFoundException();
    }
    this.apply(new SalesInvoiceRemovedEvent(found));
  }

  async update(updatePayload: SalesInvoiceUpdateDto) {
    const provider = await this.salesInvoiceService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    if (provider.status !== DRAFT_STATUS) {
      throw new BadRequestException(
        provider.status + SALES_INVOICE_CANNOT_BE_UPDATED,
      );
    }
    this.apply(new SalesInvoiceUpdatedEvent(updatePayload));
  }

  cancelSalesInvoice(uuid: string, clientHttpRequest: any) {
    return this.validateSalesInvoicePolicy.validateSalesInvoice(uuid).pipe(
      switchMap(salesInvoice => {
        return this.validateSalesInvoicePolicy
          .validateQueueState(salesInvoice)
          .pipe(
            switchMap(() => {
              return this.validateSalesInvoicePolicy
                .validateInvoiceStateForCancel(salesInvoice.status)
                .pipe(
                  switchMap(() => {
                    return this.validateSalesInvoicePolicy
                      .validateInvoiceOnErp(salesInvoice)
                      .pipe(
                        switchMap(() => {
                          return this.validateSalesInvoicePolicy
                            .getCanceledDeliveryNotes(salesInvoice)
                            .pipe(
                              switchMap(deliveryNoteNames => {
                                return from(
                                  this.salesInvoiceService.updateOne(
                                    { uuid: salesInvoice.uuid },
                                    {
                                      $set: { inQueue: true, isSynced: false },
                                    },
                                  ),
                                ).pipe(
                                  switchMap(() => {
                                    this.apply(
                                      new SalesInvoiceCanceledEvent(
                                        salesInvoice,
                                      ),
                                    );
                                    this.syncCancelSalesInvoice(
                                      deliveryNoteNames,
                                      salesInvoice,
                                      clientHttpRequest,
                                    ).subscribe({
                                      next: async res => {
                                        await this.salesInvoiceService.updateOne(
                                          { uuid: salesInvoice.uuid },
                                          {
                                            $set: {
                                              inQueue: false,
                                              isSynced: true,
                                            },
                                          },
                                        );
                                      },
                                      error: async err => {
                                        await this.salesInvoiceService.updateOne(
                                          { uuid: salesInvoice.uuid },
                                          {
                                            $set: {
                                              inQueue: false,
                                              isSynced: false,
                                            },
                                          },
                                        );
                                      },
                                    });
                                    return of({});
                                  }),
                                );
                              }),
                            );
                        }),
                      );
                  }),
                );
            }),
          );
      }),
    );
  }

  submitSalesInvoice(uuid: string, clientHttpRequest: any) {
    return this.validateSalesInvoicePolicy.validateSalesInvoice(uuid).pipe(
      switchMap(salesInvoice => {
        return this.validateSalesInvoicePolicy
          .validateCustomer(salesInvoice)
          .pipe(
            switchMap(() => {
              return this.validateSalesInvoicePolicy
                .validateSubmittedState(salesInvoice)
                .pipe(
                  switchMap(() => {
                    return this.validateSalesInvoicePolicy.validateQueueState(
                      salesInvoice,
                    );
                  }),
                )
                .pipe(
                  switchMap(isValid => {
                    return from(
                      this.salesInvoiceService.updateOne(
                        { uuid: salesInvoice.uuid },
                        { $set: { inQueue: true } },
                      ),
                    ).pipe(
                      switchMap(() => {
                        this.apply(
                          new SalesInvoiceSubmittedEvent(salesInvoice),
                        );
                        return this.syncSubmittedSalesInvoice(
                          salesInvoice,
                          clientHttpRequest,
                        );
                      }),
                    );
                  }),
                );
            }),
          );
      }),
    );
  }

  cancelAllDeliveryNotes(
    deliveryNoteNames: string[],
    invoice_name: string,
    clientHttpRequest: any,
  ) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings || !settings.authServerURL)
          return throwError(new NotImplementedException());
        return from(deliveryNoteNames).pipe(
          concatMap(delivery_note_name => {
            return of({}).pipe(
              mergeMap(() => {
                const url = `${settings.authServerURL}${FRAPPE_CLIENT_CANCEL}`;
                const body = {
                  doctype: 'Delivery Note',
                  name: delivery_note_name,
                };

                return this.http
                  .post(url, JSON.stringify(body), {
                    headers: {
                      [AUTHORIZATION]:
                        BEARER_HEADER_VALUE_PREFIX +
                        clientHttpRequest.token.accessToken,
                      [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
                      [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
                    },
                  })
                  .pipe(map(data => data.data.data));
              }),
              catchError(err => {
                if (
                  (err.response && err.response.status === 403) ||
                  (err.response.data &&
                    err.response.data.exc.includes(VALIDATE_AUTH_STRING))
                ) {
                  return this.tokenService
                    .getUserAccessToken(clientHttpRequest.token.email)
                    .pipe(
                      mergeMap(token => {
                        clientHttpRequest.token.accessToken = token.accessToken;
                        return throwError(new BadRequestException(err));
                      }),
                    );
                }
                return throwError(new BadRequestException(err));
              }),
              retry(3),
            );
          }),
          toArray(),
          switchMap(() => {
            return this.cancelSalesInvoiceFromErp(
              invoice_name,
              clientHttpRequest,
            );
          }),
          catchError(err => {
            return throwError(
              new BadRequestException(
                err.response ? err.response.data.exc : err,
              ),
            );
          }),
        );
      }),
    );
  }

  cancelSalesInvoiceFromErp(invoice_name: string, clientHttpRequest: any) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings || !settings.authServerURL)
          return throwError(new NotImplementedException());

        const url = `${settings.authServerURL}${FRAPPE_CLIENT_CANCEL}`;
        const body = {
          doctype: 'Sales Invoice',
          name: invoice_name,
        };
        return this.http
          .post(url, JSON.stringify(body), {
            headers: {
              [AUTHORIZATION]:
                BEARER_HEADER_VALUE_PREFIX +
                clientHttpRequest.token.accessToken,
              [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
              [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
            },
          })
          .pipe(
            map(data => data.data.data),
            catchError(err => {
              return throwError(
                new BadRequestException(
                  err.response ? err.response.data.exc : err,
                ),
              );
            }),
          );
      }),
    );
  }

  syncCancelSalesInvoice(
    deliveryNoteNames: string[],
    salesInvoice: SalesInvoice,
    clientHttpRequest: any,
  ) {
    if (deliveryNoteNames.length !== 0) {
      return this.cancelAllDeliveryNotes(
        deliveryNoteNames,
        salesInvoice.name,
        clientHttpRequest,
      );
    } else {
      return this.cancelSalesInvoiceFromErp(
        salesInvoice.name,
        clientHttpRequest,
      );
    }
  }

  syncSubmittedSalesInvoice(
    salesInvoice: SalesInvoice,
    clientHttpRequest: any,
  ) {
    return this.settingsService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings || !settings.authServerURL) {
            this.salesInvoiceService
              .updateOne(
                { uuid: salesInvoice.uuid },
                { $set: { inQueue: false } },
              )
              .then(success => {})
              .catch(error => {});
            return throwError(new NotImplementedException());
          }
          const body = this.mapSalesInvoice(salesInvoice);

          return this.http.post(
            settings.authServerURL + FRAPPE_API_SALES_INVOICE_ENDPOINT,
            body,
            {
              headers: {
                [AUTHORIZATION]:
                  BEARER_HEADER_VALUE_PREFIX +
                  clientHttpRequest.token.accessToken,
                [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
                [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
              },
            },
          );
        }),
      )
      .pipe(map(data => data.data.data))
      .pipe(
        switchMap(successResponse => {
          return from(
            this.salesInvoiceService.updateOne(
              { uuid: salesInvoice.uuid },
              {
                $set: {
                  isSynced: true,
                  submitted: true,
                  inQueue: false,
                  name: successResponse.name,
                },
              },
            ),
          );
        }),
        catchError(err => {
          this.errorLogService.createErrorLog(
            err,
            'Sales Invoice',
            'salesInvoice',
            clientHttpRequest,
          );
          this.salesInvoiceService
            .updateOne(
              { uuid: salesInvoice.uuid },
              {
                $set: {
                  inQueue: false,
                  isSynced: false,
                  submitted: false,
                  status: DRAFT_STATUS,
                },
              },
            )
            .then(updated => {})
            .catch(error => {});
          return throwError(
            new BadRequestException(err.response ? err.response.data.exc : err),
          );
        }),
      );
  }

  mapSalesInvoice(salesInvoice: SalesInvoice) {
    return {
      // title: salesInvoice.title ,
      docstatus: 1,
      customer: salesInvoice.customer,
      company: salesInvoice.company,
      posting_date: salesInvoice.posting_date,
      set_posting_time: salesInvoice.set_posting_time,
      due_date: salesInvoice.due_date,
      contact_email: salesInvoice.contact_email,
      territory: salesInvoice.territory,
      total_qty: salesInvoice.total_qty,
      update_stock: salesInvoice.update_stock,
      total: salesInvoice.total,
      items: salesInvoice.items.filter(each => {
        delete each.owner;
        return each;
      }),
      timesheets: salesInvoice.timesheets,
      taxes: salesInvoice.taxes,
      payment_schedule: salesInvoice.payment_schedule,
      payments: salesInvoice.payments,
      sales_team: salesInvoice.sales_team,
      remarks: salesInvoice.remarks,
    };
  }

  createSalesReturn(
    createReturnPayload: CreateSalesReturnDto,
    clientHttpRequest,
  ) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings) {
          return throwError(new NotImplementedException());
        }
        return from(
          this.validateSalesInvoicePolicy.validateSalesReturn(
            createReturnPayload,
          ),
        ).pipe(
          switchMap((salesInvoice: SalesInvoice) => {
            this.createCreditNote(
              settings,
              createReturnPayload,
              clientHttpRequest,
              salesInvoice,
            );
            const deliveryNote = new DeliveryNote();
            Object.assign(deliveryNote, createReturnPayload);
            this.http
              .post(
                settings.authServerURL + POST_DELIVERY_NOTE_ENDPOINT,
                deliveryNote,
                {
                  headers: {
                    [AUTHORIZATION]:
                      BEARER_HEADER_VALUE_PREFIX +
                      clientHttpRequest.token.accessToken,
                    [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
                    [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
                  },
                },
              )
              .pipe(map(data => data.data.data))
              .subscribe({
                next: response => {
                  const deliveryNoteData = new DeliveryNote();
                  deliveryNoteData.uuid = uuidv4();
                  deliveryNoteData.isSynced = false;
                  deliveryNoteData.inQueue = false;
                  deliveryNoteData.is_return = true;
                  deliveryNoteData.createdByEmail =
                    clientHttpRequest.token.email;
                  deliveryNoteData.createdBy = clientHttpRequest.token.fullName;
                  deliveryNoteData.issue_credit_note = true;
                  const delivery = this.mapCreateDeliveryNote(response);
                  Object.assign(deliveryNoteData, delivery);
                  this.deliveryNoteService.create(deliveryNoteData);
                },
                error: err => {
                  this.errorLogService.createErrorLog(
                    err,
                    'Delivery Note',
                    'deliveryNote',
                    clientHttpRequest,
                  );
                },
              });
            return of({});
          }),
        );
      }),
    );
  }

  createCreditNote(
    settings,
    assignPayload: CreateSalesReturnDto,
    clientHttpRequest,
    salesInvoice: SalesInvoice,
  ) {
    const body = this.mapCreditNote(assignPayload, salesInvoice);
    return this.http
      .post(settings.authServerURL + LIST_CREDIT_NOTE_ENDPOINT, body, {
        headers: {
          [AUTHORIZATION]:
            BEARER_HEADER_VALUE_PREFIX + clientHttpRequest.token.accessToken,
          [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
          [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
        },
      })
      .pipe(map(data => data.data.data))
      .subscribe({
        next: (success: { name: string }) => {
          this.salesInvoiceService
            .updateOne(
              { name: salesInvoice.name },
              { $set: { credit_note: success.name } },
            )
            .then(created => {})
            .catch(error => {});
        },
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            'Credit Note',
            'salesInvoice',
            clientHttpRequest,
          );
        },
      });
  }

  mapCreditNote(
    assignPayload: CreateSalesReturnDto,
    salesInvoice: SalesInvoice,
  ) {
    // cleanup math calculations after DTO validations are added
    return {
      docstatus: 1,
      customer: assignPayload.customer,
      is_return: 1,
      company: assignPayload.company,
      posting_date: assignPayload.posting_date,
      return_against: salesInvoice.name,
      posting_time: assignPayload.posting_time,
      items: assignPayload.items.map(item => {
        return {
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
        };
      }),
    };
  }

  mapCreateDeliveryNote(
    assignPayload: DeliveryNoteWebhookDto,
  ): CreateDeliveryNoteInterface {
    const deliveryNoteBody: CreateDeliveryNoteInterface = {};
    deliveryNoteBody.docstatus = 1;
    deliveryNoteBody.posting_date = assignPayload.posting_date;
    deliveryNoteBody.posting_time = assignPayload.posting_time;
    deliveryNoteBody.is_return = true;
    deliveryNoteBody.issue_credit_note = true;
    deliveryNoteBody.contact_email = assignPayload.contact_email;
    deliveryNoteBody.set_warehouse = assignPayload.set_warehouse;
    deliveryNoteBody.customer = assignPayload.customer;
    deliveryNoteBody.company = assignPayload.company;
    deliveryNoteBody.total_qty = assignPayload.total_qty;
    deliveryNoteBody.total = assignPayload.total;
    deliveryNoteBody.items = this.mapSerialsFromItem(assignPayload.items);
    // deliveryNoteBody.pricing_rules = []
    // deliveryNoteBody.packed_items = []
    // deliveryNoteBody.taxes = []
    // deliveryNoteBody.sales_team = []
    return deliveryNoteBody;
  }

  mapSerialsFromItem(items: CreateDeliveryNoteItemInterface[]) {
    const itemData = [];
    items.forEach(eachItemData => {
      itemData.push({
        item_code: eachItemData.item_code,
        qty: eachItemData.qty,
        rate: eachItemData.rate,
        serial_no: eachItemData.serial_no,
        against_sales_invoice: eachItemData.against_sales_invoice,
        amount: eachItemData.amount,
      });
    });
    return itemData;
  }
}
