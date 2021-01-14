import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  HttpService,
} from '@nestjs/common';
import { StockEntryService } from '../../entities/stock-entry.service';
import { StockEntryDto } from '../../entities/stock-entry-dto';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import {
  switchMap,
  mergeMap,
  retry,
  concatMap,
  toArray,
  catchError,
} from 'rxjs/operators';
import { StockEntry } from '../../entities/stock-entry.entity';
import { from, throwError, of, forkJoin } from 'rxjs';
import {
  STOCK_ENTRY,
  FRAPPE_QUEUE_JOB,
  STOCK_ENTRY_SERIALS_BATCH_SIZE,
  STOCK_ENTRY_STATUS,
  CREATE_STOCK_ENTRY_JOB,
  ACCEPT_STOCK_ENTRY_JOB,
  REJECT_STOCK_ENTRY_JOB,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import {
  INVALID_FILE,
  STOCK_ENTRY_TYPE,
  AGENDA_JOB_STATUS,
  DOC_NAMES,
} from '../../../constants/app-strings';
import { SerialBatchService } from '../../../sync/aggregates/serial-batch/serial-batch.service';
import { DateTime } from 'luxon';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { FRAPPE_CLIENT_CANCEL } from '../../../constants/routes';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';

@Injectable()
export class StockEntryAggregateService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly serialBatchService: SerialBatchService,
    private readonly http: HttpService,
    private readonly settingService: SettingsService,
    private readonly serialHistoryService: SerialNoHistoryService,
    private readonly serialNoService: SerialNoService,
  ) {}

  createStockEntry(payload: StockEntryDto, req) {
    payload = this.parseStockEntryPayload(payload);
    if (payload.status === STOCK_ENTRY_STATUS.draft || !payload.uuid) {
      return this.saveDraft(payload, req);
    }
    return this.stockEntryPolicies.validateStockEntry(payload, req).pipe(
      switchMap(valid => {
        return from(this.stockEntryService.findOne({ uuid: payload.uuid }));
      }),
      switchMap(stockEntry => {
        if (!stockEntry) {
          return throwError(new BadRequestException('Stock Entry not found'));
        }
        const mongoSerials: SerialHash = this.getStockEntryMongoSerials(
          stockEntry,
        );

        if (stockEntry.stock_entry_type === STOCK_ENTRY_TYPE.MATERIAL_RECEIPT) {
          if (mongoSerials && mongoSerials.length) {
            return from(
              this.serialNoService.insertMany(mongoSerials, { ordered: false }),
            ).pipe(
              switchMap(success => {
                this.batchQueueStockEntry(stockEntry, req, stockEntry.uuid);
                return of(stockEntry);
              }),
            );
          }
          this.batchQueueStockEntry(stockEntry, req, stockEntry.uuid);
          return of(stockEntry);
        }

        this.batchQueueStockEntry(stockEntry, req, stockEntry.uuid);
        if (!mongoSerials) {
          return of(stockEntry);
        }
        return from(Object.keys(mongoSerials)).pipe(
          mergeMap(key => {
            return from(
              this.serialNoService.updateOne(
                { serial_no: { $in: mongoSerials[key].serial_no } },
                {
                  $set: {
                    queue_state: {
                      stock_entry: {
                        parent: stockEntry.uuid,
                        warehouse: mongoSerials[key].t_warehouse,
                      },
                    },
                  },
                },
              ),
            );
          }),
          toArray(),
          switchMap(success => {
            return of(stockEntry);
          }),
        );
      }),
      switchMap(stockEntry => {
        return from(
          this.stockEntryService.updateOne(
            { uuid: stockEntry.uuid },
            {
              $set: {
                status:
                  payload.stock_entry_type ===
                  STOCK_ENTRY_TYPE.MATERIAL_TRANSFER
                    ? STOCK_ENTRY_STATUS.in_transit
                    : STOCK_ENTRY_STATUS.delivered,
              },
            },
          ),
        );
      }),
    );
  }

  parseStockEntryPayload(payload: StockEntryDto) {
    switch (payload.stock_entry_type) {
      case STOCK_ENTRY_TYPE.MATERIAL_RECEIPT:
        return payload;

      case STOCK_ENTRY_TYPE.MATERIAL_ISSUE:
        payload.items.filter(item => {
          delete item.basic_rate;
          return item;
        });
        return payload;

      case STOCK_ENTRY_TYPE.MATERIAL_TRANSFER:
        payload.items.filter(item => {
          delete item.basic_rate;
          return item;
        });
        return payload;

      default:
        return payload;
    }
  }

  getStockEntryMongoSerials(stockEntry) {
    let mongoSerials;
    stockEntry.items.forEach(item => {
      if (!item.has_serial_no) return;
      item.serial_no.forEach(serial_no => {
        if (stockEntry.stock_entry_type === STOCK_ENTRY_TYPE.MATERIAL_RECEIPT) {
          if (!mongoSerials) mongoSerials = [];
          mongoSerials.push({
            serial_no,
            item_code: item.item_code,
            item_name: item.item_name,
            company: stockEntry.company,
            queue_state: {
              stock_entry: {
                parent: stockEntry.uuid,
                warehouse: item.t_warehouse,
              },
            },
          });
          return;
        }
        if (!mongoSerials) mongoSerials = {};
        if (mongoSerials[item.item_code]) {
          mongoSerials[item.item_code].serial_no.push(serial_no);
        } else {
          mongoSerials[item.item_code] = { serial_no: [serial_no] };
          mongoSerials[item.item_code].t_warehouse = item.t_warehouse;
        }
      });
    });
    return mongoSerials;
  }

  async deleteDraft(uuid: string) {
    const stockEntry = await this.stockEntryService.findOne({ uuid });
    if (!stockEntry) {
      throw new BadRequestException('Stock Entry Not Found');
    }
    if (stockEntry.status !== STOCK_ENTRY_STATUS.draft) {
      throw new BadRequestException(
        `Stock Entry with status ${stockEntry.status}, cannot be deleted.`,
      );
    }
    await this.stockEntryService.deleteOne({ uuid });
    return true;
  }

  resetStockEntry(uuid: string, req) {
    return from(this.stockEntryService.findOne({ uuid })).pipe(
      switchMap(stockEntry => {
        if (!stockEntry) {
          return throwError(new NotFoundException('Stock Entry not found'));
        }
        return forkJoin({
          stockEntry: this.stockEntryPolicies.validateStockEntryCancel(
            stockEntry,
          ),
          stockEntryQueue: this.stockEntryPolicies.validateStockEntryQueue(
            stockEntry,
          ),
          settings: this.settingService.find(),
        });
      }),
      switchMap(({ stockEntry, settings }) => {
        return this.cancelERPNextDocument(stockEntry, settings, req);
      }),
      switchMap(stockEntry => {
        return forkJoin({
          serialReset: this.resetStockEntrySerial(stockEntry),
          serialHistoryReset: this.resetStockEntrySerialHistory(stockEntry),
        }).pipe(switchMap(success => this.updateStockEntryReset(stockEntry)));
      }),
    );
  }

  cancelERPNextDocument(stockEntry: StockEntry, settings: ServerSettings, req) {
    return from(stockEntry.names).pipe(
      concatMap(docName => {
        const doctypeName =
          stockEntry.stock_entry_type === STOCK_ENTRY_TYPE.RnD_PRODUCTS
            ? DOC_NAMES.DELIVERY_NOTE
            : DOC_NAMES.STOCK_ENTRY;
        return this.cancelDoc(doctypeName, docName, settings, req);
      }),
      catchError(err => {
        if (
          err?.response?.data?.exc &&
          err?.response?.data?.exc.includes('Cannot edit cancelled document')
        ) {
          return of(true);
        }
        return throwError(new BadRequestException(err));
      }),
      toArray(),
      switchMap(success => {
        return of(stockEntry);
      }),
    );
  }

  saveDraft(payload: StockEntryDto, req) {
    if (payload.uuid) {
      return from(
        this.stockEntryService.updateOne(
          { uuid: payload.uuid },
          { $set: payload },
        ),
      ).pipe(switchMap(data => of(payload)));
    }
    return this.settingService.find().pipe(
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        stockEntry.status = STOCK_ENTRY_STATUS.draft;
        return from(this.stockEntryService.create(stockEntry)).pipe(
          switchMap(data => of(stockEntry)),
        );
      }),
    );
  }

  batchQueueStockEntry(payload: StockEntryDto, req, uuid: string) {
    this.serialBatchService
      .batchItems(payload.items, STOCK_ENTRY_SERIALS_BATCH_SIZE)
      .pipe(
        switchMap((itemBatch: any) => {
          this.batchAddToQueue(
            itemBatch,
            payload,
            req,
            CREATE_STOCK_ENTRY_JOB,
            uuid,
          );
          return of({});
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  batchAddToQueue(itemBatch, payload, req, type, parentUuid: string) {
    payload.items = [];
    from(itemBatch)
      .pipe(
        concatMap(item => {
          payload.items = [item];
          return from(
            this.addToQueueNow({ payload, token: req.token, type }, parentUuid),
          );
        }),
        retry(3),
        switchMap(success => {
          return of();
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  setStockEntryDefaults(
    payload: StockEntryDto,
    clientHttpRequest,
    settings: ServerSettings,
  ): StockEntry {
    const stockEntry = new StockEntry();
    Object.assign(stockEntry, payload);
    delete stockEntry.names;
    stockEntry.uuid = uuidv4();
    stockEntry.doctype = STOCK_ENTRY;
    stockEntry.set_posting_time = 1;
    stockEntry.createdOn = payload.posting_date;
    stockEntry.createdAt = new DateTime(settings.timeZone).toJSDate();
    stockEntry.createdByEmail = clientHttpRequest.token.email;
    stockEntry.createdBy = clientHttpRequest.token.fullName;
    stockEntry.status = STOCK_ENTRY_STATUS.in_transit;
    stockEntry.isSynced = false;
    stockEntry.inQueue = true;
    stockEntry.docstatus = 1;
    return stockEntry;
  }

  addToQueueNow(
    data: {
      payload: any;
      token: any;
      type: string;
      parent?: string;
      status?: string;
    },
    parentUuid: string,
  ) {
    data.parent = parentUuid;
    data.status = AGENDA_JOB_STATUS.in_queue;
    return this.agenda.now(FRAPPE_QUEUE_JOB, data);
  }

  StockEntryFromFile(file, req) {
    return from(this.getJsonData(file)).pipe(
      switchMap((data: StockEntryDto) => {
        if (!data) {
          return throwError(new BadRequestException(INVALID_FILE));
        }
        return this.createStockEntry(data, req);
      }),
    );
  }

  getJsonData(file) {
    return of(JSON.parse(file.buffer));
  }

  getStockEntryList(offset, limit, sort, filter_query) {
    return this.stockEntryService.list(offset, limit, sort, filter_query);
  }

  getStockEntry(uuid: string) {
    return from(this.stockEntryService.findOne({ uuid })).pipe(
      switchMap(stockEntry => {
        if (stockEntry.status !== STOCK_ENTRY_STATUS.draft) {
          stockEntry.items.filter(item => {
            if (item.serial_no && item.serial_no.length) {
              item.serial_no = [
                item.serial_no[0],
                item.serial_no[item.serial_no.length - 1],
              ];
            }
            return item;
          });
        }
        return of(stockEntry);
      }),
    );
  }

  rejectStockEntry(uuid: string, req) {
    return from(this.stockEntryService.findOne({ uuid })).pipe(
      mergeMap(stockEntry => {
        if (!stockEntry) {
          return throwError(new BadRequestException('Stock Entry not found.'));
        }
        const payload: any = this.removeStockEntryFields(stockEntry);
        this.stockEntryService
          .updateOne(
            { uuid },
            { $set: { status: STOCK_ENTRY_STATUS.returned } },
          )
          .catch(err => {})
          .then(success => {});
        return this.serialBatchService
          .batchItems(payload.items, STOCK_ENTRY_SERIALS_BATCH_SIZE)
          .pipe(
            switchMap((itemBatch: any) => {
              payload.items = [itemBatch];
              this.batchAddToQueue(
                itemBatch,
                payload,
                req,
                REJECT_STOCK_ENTRY_JOB,
                stockEntry.uuid,
              );
              return of({});
            }),
          );
      }),
    );
  }

  removeStockEntryFields(stockEntry: StockEntry) {
    delete stockEntry.names;
    delete stockEntry.createdAt;
    return stockEntry;
  }

  acceptStockEntry(uuid: string, req) {
    return from(this.stockEntryService.findOne({ uuid })).pipe(
      mergeMap(stockEntry => {
        if (!stockEntry) {
          return throwError(new BadRequestException('Stock Entry not found.'));
        }
        const payload: any = this.removeStockEntryFields(stockEntry);
        this.stockEntryService
          .updateOne(
            { uuid },
            { $set: { status: STOCK_ENTRY_STATUS.delivered } },
          )
          .catch(err => {})
          .then(success => {});
        return this.serialBatchService
          .batchItems(payload.items, STOCK_ENTRY_SERIALS_BATCH_SIZE)
          .pipe(
            switchMap((itemBatch: any) => {
              payload.items = [itemBatch];
              this.batchAddToQueue(
                itemBatch,
                payload,
                req,
                ACCEPT_STOCK_ENTRY_JOB,
                stockEntry.uuid,
              );
              return of({});
            }),
          );
      }),
    );
  }

  cancelDoc(doctype, docName, settings: ServerSettings, req) {
    const doc = {
      doctype,
      name: docName,
    };
    return this.http.post(settings.authServerURL + FRAPPE_CLIENT_CANCEL, doc, {
      headers: {
        [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + req.token.accessToken,
      },
    });
  }

  updateStockEntryReset(stockEntry: StockEntry) {
    return from(
      this.stockEntryService.updateOne(
        { uuid: stockEntry.uuid },
        {
          $set: {
            status: STOCK_ENTRY_STATUS.reseted,
          },
        },
      ),
    );
  }

  resetStockEntrySerial(stockEntry: StockEntry) {
    switch (stockEntry.stock_entry_type) {
      case STOCK_ENTRY_TYPE.MATERIAL_RECEIPT:
        return from(
          this.serialNoService.deleteMany({
            purchase_invoice_name: stockEntry.uuid,
          }),
        );

      case STOCK_ENTRY_TYPE.MATERIAL_ISSUE:
        return this.resetMaterialIssueSerials(stockEntry);

      case STOCK_ENTRY_TYPE.RnD_PRODUCTS:
        return this.resetMaterialIssueSerials(stockEntry);

      case STOCK_ENTRY_TYPE.MATERIAL_TRANSFER:
        return of({});

      default:
        return throwError(new BadRequestException('Invalid Stock Entry type.'));
    }
  }

  resetMaterialIssueSerials(stockEntry: StockEntry) {
    return from(stockEntry.items).pipe(
      concatMap(item => {
        if (!item.has_serial_no) {
          return of(true);
        }
        return from(
          this.serialNoService.updateMany(
            {
              serial_no: { $in: item.serial_no },
            },
            {
              $set: {
                warehouse: item.s_warehouse,
              },
              $unset: {
                sales_document_type: null,
                sales_document_no: null,
                sales_invoice_name: null,
                'warranty.salesWarrantyDate': null,
                'warranty.soldOn': null,
              },
            },
          ),
        );
      }),
    );
  }

  resetStockEntrySerialHistory(stockEntry: StockEntry) {
    switch (stockEntry.stock_entry_type) {
      case STOCK_ENTRY_TYPE.MATERIAL_RECEIPT:
        return from(
          this.serialHistoryService.deleteMany({
            parent_document: stockEntry.uuid,
          }),
        );

      case STOCK_ENTRY_TYPE.MATERIAL_ISSUE:
        return from(
          this.serialHistoryService.deleteMany({
            parent_document: stockEntry.uuid,
          }),
        );

      case STOCK_ENTRY_TYPE.RnD_PRODUCTS:
        return from(
          this.serialHistoryService.deleteMany({
            parent_document: stockEntry.uuid,
          }),
        );

      case STOCK_ENTRY_TYPE.MATERIAL_TRANSFER:
        return of({});

      default:
        return throwError(new BadRequestException('Invalid Stock Entry type.'));
    }
  }
}

export interface SerialHash {
  [key: string]: { serial_no: string[]; t_warehouse: string };
}
