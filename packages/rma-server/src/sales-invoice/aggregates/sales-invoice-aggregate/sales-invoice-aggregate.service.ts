import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  HttpService,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import {
  MRPRateUpdateInterface,
  SalesInvoiceDto,
} from '../../entity/sales-invoice/sales-invoice-dto';
import { SalesInvoice } from '../../entity/sales-invoice/sales-invoice.entity';
import { SalesInvoiceAddedEvent } from '../../event/sales-invoice-added/sales-invoice-added.event';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SalesInvoiceRemovedEvent } from '../../event/sales-invoice-removed/sales-invoice-removed.event';
import { SalesInvoiceUpdatedEvent } from '../../event/sales-invoice-updated/sales-invoice-updated.event';
import { SalesInvoiceUpdateDto } from '../../entity/sales-invoice/sales-invoice-update-dto';
import { SALES_INVOICE_CANNOT_BE_UPDATED } from '../../../constants/messages';
import { SalesInvoiceSubmittedEvent } from '../../event/sales-invoice-submitted/sales-invoice-submitted.event';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap, map, catchError, toArray, concatMap } from 'rxjs/operators';
import { throwError, of, from, forkJoin } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  DRAFT_STATUS,
  DEFAULT_NAMING_SERIES,
  SYSTEM_MANAGER,
  DELIVERY_NOTE,
  SALES_INVOICE_STATUS,
  ALL_TERRITORIES,
  INVOICE_DELIVERY_STATUS,
  CANCELED_STATUS,
  REJECTED_STATUS,
} from '../../../constants/app-strings';
import { ACCEPT } from '../../../constants/app-strings';
import { APP_WWW_FORM_URLENCODED } from '../../../constants/app-strings';
import {
  FRAPPE_API_SALES_INVOICE_ENDPOINT,
  POST_DELIVERY_NOTE_ENDPOINT,
  LIST_CREDIT_NOTE_ENDPOINT,
  FRAPPE_API_SALES_INVOICE_ITEM_ENDPOINT,
} from '../../../constants/routes';
import { SalesInvoicePoliciesService } from '../../../sales-invoice/policies/sales-invoice-policies/sales-invoice-policies.service';
import { CreateSalesReturnDto } from '../../entity/sales-invoice/sales-return-dto';
import { DeliveryNote } from '../../../delivery-note/entity/delivery-note-service/delivery-note.entity';
import {
  CreateDeliveryNoteInterface,
  CreateDeliveryNoteItemInterface,
} from '../../../delivery-note/entity/delivery-note-service/create-delivery-note-interface';
import { DeliveryNoteWebhookDto } from '../../../delivery-note/entity/delivery-note-service/delivery-note-webhook.dto';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { DateTime } from 'luxon';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
import {
  EventType,
  SerialNoHistoryInterface,
} from '../../../serial-no/entity/serial-no-history/serial-no-history.entity';
import { ItemService } from '../../../item/entity/item/item.service';
import { ItemAggregateService } from '../../../item/aggregates/item-aggregate/item-aggregate.service';
import { getParsedPostingDate } from '../../../constants/agenda-job';
import { Item } from '../../../item/entity/item/item.entity';
@Injectable()
export class SalesInvoiceAggregateService extends AggregateRoot {
  constructor(
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly validateSalesInvoicePolicy: SalesInvoicePoliciesService,
    private readonly serialNoService: SerialNoService,
    private readonly errorLogService: ErrorLogService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly serialNoHistoryService: SerialNoHistoryService,
    private readonly itemService: ItemService,
    private readonly itemAggregateService: ItemAggregateService,
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
              salesInvoice.delivery_status =
                INVOICE_DELIVERY_STATUS.DELIVERED_TO_CUSTOMER;
              salesInvoice.created_on = new DateTime(
                settings.timeZone,
              ).toJSDate();
              salesInvoice.timeStamp = {
                created_on: getParsedPostingDate(salesInvoice),
              };
              salesInvoice.isSynced = false;
              salesInvoice.inQueue = false;
              this.apply(
                new SalesInvoiceAddedEvent(salesInvoice, clientHttpRequest),
              );
              return of(salesInvoice);
            }),
          );
      }),
    );
  }

  async retrieveSalesInvoice(uuid: string, req) {
    let filter = {};
    const territory = this.getUserTerritories(req);
    if (!territory.includes(ALL_TERRITORIES)) {
      filter = { territory: { $in: territory } };
    }
    const provider = await this.salesInvoiceService.findOne(
      { $or: [{ uuid }, { name: uuid }], ...filter },
      undefined,
      true,
    );
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getSalesInvoiceList(
    offset,
    limit,
    sort,
    filter_query,
    clientHttpRequest: { token: TokenCache },
  ) {
    const territory = this.getUserTerritories(clientHttpRequest);
    return await this.salesInvoiceService.list(
      offset || 0,
      limit || 10,
      sort,
      filter_query,
      territory,
    );
  }

  getUserTerritories(clientHttpRequest: { token: TokenCache }) {
    return clientHttpRequest.token.roles.includes(SYSTEM_MANAGER)
      ? [ALL_TERRITORIES]
      : clientHttpRequest.token.territory;
  }

  async remove(uuid: string) {
    const salesInvoice = await this.salesInvoiceService.findOne({ uuid });
    if (!salesInvoice) {
      throw new NotFoundException();
    }
    if (salesInvoice.status !== SALES_INVOICE_STATUS.draft) {
      return throwError(
        new BadRequestException(
          `Sales Invoice with ${salesInvoice.status} status cannot be deleted.`,
        ),
      );
    }
    this.apply(new SalesInvoiceRemovedEvent(salesInvoice));
  }

  async update(updatePayload: SalesInvoiceUpdateDto, clientHttpRequest: any) {
    const isValid = await this.validateSalesInvoicePolicy
      .validateItems(updatePayload.items)
      .toPromise();
    if (!isValid)
      throw new BadRequestException('Failed to validate Sales Invoice Items.');
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

  submitSalesInvoice(uuid: string, clientHttpRequest: any) {
    return this.validateSalesInvoicePolicy.validateSalesInvoice(uuid).pipe(
      switchMap(salesInvoice => {
        return this.validateSalesInvoicePolicy
          .validateCustomer(salesInvoice)
          .pipe(
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateItems(
                salesInvoice.items,
              );
            }),
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateCustomerCreditLimit(
                salesInvoice,
              );
            }),
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateSubmittedState(
                salesInvoice,
              );
            }),
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateQueueState(
                salesInvoice,
              );
            }),
            switchMap(() => {
              return this.validateSalesInvoicePolicy.validateSalesInvoiceStock(
                salesInvoice,
                clientHttpRequest,
              );
            }),
            switchMap(isValid => {
              salesInvoice.naming_series = DEFAULT_NAMING_SERIES.sales_invoice;
              return from(
                this.salesInvoiceService.updateOne(
                  { uuid: salesInvoice.uuid },
                  { $set: { inQueue: true } },
                ),
              );
            }),
            toArray(),
            switchMap(() => {
              return this.syncSubmittedSalesInvoice(
                salesInvoice,
                clientHttpRequest,
              );
            }),
            switchMap(() => {
              this.apply(new SalesInvoiceSubmittedEvent(salesInvoice));
              return of(salesInvoice);
            }),
          );
      }),
    );
  }

  addSalesInvoiceBundleMap(salesInvoice: SalesInvoice) {
    let itemsMap = {};
    salesInvoice.items.forEach(item => {
      itemsMap[item.item_code] = item.qty;
    });
    return this.itemAggregateService.getBundleItems(itemsMap).pipe(
      switchMap(data => {
        itemsMap = {};
        data.forEach(item => {
          itemsMap[Buffer.from(item.item_code).toString('base64')] = item.qty;
        });
        return from(
          this.salesInvoiceService.updateOne(
            { uuid: salesInvoice.uuid },
            {
              $set: {
                bundle_items_map: itemsMap,
              },
            },
          ),
        );
      }),
    );
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
                {
                  $set: {
                    inQueue: false,
                    'timeStamp.created_on': getParsedPostingDate(salesInvoice),
                  },
                },
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
          this.updateBundleItem(salesInvoice);
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
    // pretty bad code. will need cleanup. could be done when this is changed to queue.
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings) {
          return throwError(new NotImplementedException());
        }
        return forkJoin({
          items: this.validateSalesInvoicePolicy.validateSalesReturnItems(
            createReturnPayload,
          ),
          salesInvoice: this.validateSalesInvoicePolicy.validateSalesReturn(
            createReturnPayload,
          ),
          valid: this.validateSalesInvoicePolicy.validateReturnSerials(
            createReturnPayload,
          ),
        }).pipe(
          switchMap(({ salesInvoice }) => {
            delete createReturnPayload.delivery_note_names;
            const serialMap = this.getSerialMap(createReturnPayload);
            let deliveryNote = new DeliveryNote();
            Object.assign(deliveryNote, createReturnPayload);
            deliveryNote.instructions = createReturnPayload.remarks;
            delete deliveryNote.credit_note_items;
            deliveryNote = this.setDeliveryNoteDefaults(deliveryNote);

            return this.http
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
              .pipe(
                map(data => data.data.data),
                switchMap((response: DeliveryNoteWebhookDto) => {
                  response.items.filter(item => {
                    item.serial_no = serialMap[item.item_code];
                    return item;
                  });
                  this.createCreditNote(
                    settings,
                    createReturnPayload,
                    clientHttpRequest,
                    salesInvoice,
                  );
                  const items = this.mapSerialsFromItem(response.items);

                  const { returned_items_map } = this.getReturnedItemsMap(
                    items,
                    salesInvoice,
                  );

                  this.linkSalesReturn(
                    items,
                    response.name,
                    clientHttpRequest.token,
                    salesInvoice,
                    response.set_warehouse,
                    settings,
                  );

                  this.salesInvoiceService
                    .updateOne(
                      { uuid: salesInvoice.uuid },
                      { $set: { returned_items_map } },
                    )
                    .then(success => {})
                    .catch(error => {});
                  return of({});
                }),
                catchError(err => {
                  this.errorLogService.createErrorLog(
                    err,
                    'Delivery Note',
                    'deliveryNote',
                    clientHttpRequest,
                  );
                  return throwError(err);
                }),
              );
          }),
        );
      }),
      catchError(err => {
        if (err && err.response && err.response.data && err.response.data.exc) {
          return throwError(err.response.data.exc);
        }
        return throwError(err);
      }),
    );
  }

  setDeliveryNoteDefaults(deliveryNote: DeliveryNote) {
    deliveryNote.naming_series = DEFAULT_NAMING_SERIES.delivery_return;
    deliveryNote.items.forEach(item => {
      item.excel_serials = item.serial_no;
      delete item.serial_no;
    });
    return deliveryNote;
  }

  getSerialMap(createReturnPayload: CreateSalesReturnDto) {
    const hash_map = {};
    createReturnPayload.items.forEach(item => {
      hash_map[item.item_code]
        ? (hash_map[item.item_code] += item.serial_no)
        : (hash_map[item.item_code] = item.serial_no);
    });
    return hash_map;
  }

  linkSalesReturn(
    items: any[],
    sales_return_name: string,
    token: any,
    sales_invoice: SalesInvoice,
    warehouse,
    settings,
  ) {
    const serials = [];

    items = items.filter(item => {
      if (item.serial_no) {
        serials.push(...item.serial_no.split('\n'));
      }
      item.deliveredBy = token.fullName;
      item.deliveredByEmail = token.email;
      item.sales_return_name = sales_return_name;
      return item;
    });

    this.serialNoService
      .updateMany(
        { serial_no: { $in: serials } },
        {
          $set: { sales_return_name, warehouse },
          $unset: {
            customer: undefined,
            'warranty.salesWarrantyDate': undefined,
            'warranty.soldOn': undefined,
            delivery_note: undefined,
            sales_invoice_name: undefined,
          },
        },
      )
      .then(success => {
        const serialHistory: SerialNoHistoryInterface = {};
        serialHistory.created_by = token.fullName;
        serialHistory.created_on = new DateTime(settings.timeZone).toJSDate();
        serialHistory.document_no = sales_return_name;
        serialHistory.document_type = DELIVERY_NOTE;
        serialHistory.eventDate = new DateTime(settings.timeZone);
        serialHistory.eventType = EventType.SerialReturned;
        serialHistory.parent_document = sales_invoice.name;
        serialHistory.transaction_from = sales_invoice.customer;
        serialHistory.transaction_to = warehouse;
        this.serialNoHistoryService
          .addSerialHistory(serials, serialHistory)
          .subscribe({
            next: done => {},
            error: err => {},
          });
      })
      .then(updated => {})
      .catch(error => {});

    this.salesInvoiceService
      .updateMany(
        { name: sales_invoice.name },
        {
          $push: { returned_items: { $each: items } },
        },
      )
      .then(success => {})
      .catch(error => {});
  }

  updateOutstandingAmount(invoice_name: string) {
    return forkJoin({
      headers: this.clientToken.getServiceAccountApiHeaders(),
      settings: this.settingsService.find(),
    }).pipe(
      switchMap(({ headers, settings }) => {
        if (!settings || !settings.authServerURL)
          return throwError(new NotImplementedException());
        const url = `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}/${invoice_name}`;
        return this.http.get(url, { headers }).pipe(
          map(res => res.data.data),
          switchMap(sales_invoice => {
            this.salesInvoiceService
              .updateOne(
                { name: invoice_name },
                {
                  $set: {
                    outstanding_amount: sales_invoice.outstanding_amount,
                  },
                },
              )
              .then(success => {})
              .catch(error => {});
            return of({ outstanding_amount: sales_invoice.outstanding_amount });
          }),
        );
      }),
    );
  }

  async updateDeliveryStatus(payload) {
    const salesInvoice = await this.salesInvoiceService.findOne(payload.uuid);
    if (!salesInvoice) {
      throw new BadRequestException('Failed to fetch Sales Invoice.');
    }
    if ([CANCELED_STATUS, REJECTED_STATUS].includes(salesInvoice.status)) {
      this.salesInvoiceService.updateOne(
        { uuid: payload.uuid },
        {
          $set: { delivery_status: payload.delivery_status },
        },
      );
    }
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
    const body = {
      docstatus: 1,
      naming_series: DEFAULT_NAMING_SERIES.sales_return,
      customer: assignPayload.customer,
      is_return: 1,
      company: assignPayload.company,
      posting_date: assignPayload.posting_date,
      return_against: salesInvoice.name,
      posting_time: assignPayload.posting_time,
      remarks: assignPayload.remarks,
      cost_center: assignPayload.items.find(item => item).cost_center,
      items: assignPayload.items.map(item => {
        return {
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          cost_center: item.cost_center,
        };
      }),
    };
    if (assignPayload?.credit_note_items?.length) {
      body.items = assignPayload.credit_note_items;
    }
    return body;
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
        cost_center: eachItemData.cost_center,
      });
    });
    return itemData;
  }

  getReturnedItemsMap(
    items: CreateDeliveryNoteItemInterface[],
    sales_invoice: SalesInvoice,
  ) {
    const returnItemsMap = {};
    items.forEach(item => {
      returnItemsMap[Buffer.from(item.item_code).toString('base64')] = item.qty;
    });
    for (const key of Object.keys(returnItemsMap)) {
      sales_invoice.delivered_items_map[key] += returnItemsMap[key];
      if (sales_invoice.returned_items_map[key]) {
        sales_invoice.returned_items_map[key] += returnItemsMap[key];
      } else {
        sales_invoice.returned_items_map[key] = returnItemsMap[key];
      }
    }
    return {
      returned_items_map: sales_invoice.returned_items_map,
      delivered_items_map: sales_invoice.delivered_items_map,
    };
  }

  updateBundleItem(salesInvoice: SalesInvoice) {
    const itemCodes = [];
    salesInvoice.items.forEach(item => itemCodes.push(item.item_code));
    return from(
      this.itemService.count({
        item_code: { $in: itemCodes },
        bundle_items: { $exists: true },
      }),
    )
      .pipe(
        switchMap(count => {
          if (count) {
            return forkJoin({
              updateBundle: from(
                this.salesInvoiceService.updateOne(
                  { uuid: salesInvoice.uuid },
                  {
                    $set: {
                      has_bundle_item: true,
                    },
                  },
                ),
              ),
              updateBundleMap: this.addSalesInvoiceBundleMap(salesInvoice),
            });
          }
          return of(true);
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  getErpSalesInvoice(invoice_name: string, req) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        const url = `${settings.authServerURL}${FRAPPE_API_SALES_INVOICE_ENDPOINT}/${invoice_name}`;
        return this.http.get(url, {
          headers: this.settingsService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
    );
  }

  updateErpSalesInvoice(url, body, req) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        return this.http.put(`${settings.authServerURL}${url}`, body, {
          headers: this.settingsService.getAuthorizationHeaders(req.token),
        });
      }),
      map(res => res.data.data),
    );
  }

  createERPSalesInvoiceItemBody(payload: MRPRateUpdateInterface) {
    return from(
      this.itemService.findOne({ item_code: payload.item_code }),
    ).pipe(
      switchMap((item: Item) => {
        payload.mrp_sales_rate = item.mrp;
        payload.mrp_sales_amount = payload.qty * item.mrp;
        return of(payload);
      }),
    );
  }

  updateSalesInvoiceItemMRPRate(invoice_name: string, req) {
    let mrp_sales_grand_total = 0;
    return this.getErpSalesInvoice(invoice_name, req).pipe(
      switchMap((salesInvoice: SalesInvoiceDto) => {
        return from(salesInvoice.items ? salesInvoice.items : []).pipe(
          concatMap(item => {
            return this.createERPSalesInvoiceItemBody(item);
          }),
          toArray(),
        );
      }),
      switchMap(items => {
        (items ? items : []).forEach(item => {
          mrp_sales_grand_total += item.mrp_sales_amount;
        });
        return this.updateERPSalesInvoiceItems(items, req);
      }),
      switchMap(() => {
        return this.updateErpSalesInvoice(
          `${FRAPPE_API_SALES_INVOICE_ENDPOINT}/${invoice_name}`,
          { mrp_sales_grand_total },
          req,
        );
      }),
    );
  }

  updateERPSalesInvoiceItems(items: MRPRateUpdateInterface[], req) {
    return from(items).pipe(
      concatMap((item: MRPRateUpdateInterface) => {
        return this.updateErpSalesInvoice(
          `${FRAPPE_API_SALES_INVOICE_ITEM_ENDPOINT}/${item.name}`,
          {
            mrp_sales_rate: item.mrp_sales_rate,
            mrp_sales_amount: item.mrp_sales_amount,
          },
          req,
        );
      }),
      toArray(),
    );
  }
}
