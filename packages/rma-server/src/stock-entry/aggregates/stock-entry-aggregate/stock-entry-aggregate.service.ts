import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryDto } from '../../stock-entry/stock-entry-dto';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { switchMap, mergeMap, retry, concatMap } from 'rxjs/operators';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { from, throwError, of } from 'rxjs';
import {
  STOCK_ENTRY,
  FRAPPE_QUEUE_JOB,
  STOCK_ENTRY_SERIALS_BATCH_SIZE,
  STOCK_ENTRY_STATUS,
} from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import {
  CREATE_STOCK_ENTRY_JOB,
  ACCEPT_STOCK_ENTRY_JOB,
  REJECT_STOCK_ENTRY_JOB,
} from '../../schedular/stock-entry-sync/stock-entry-sync.service';
import {
  INVALID_FILE,
  AGENDA_JOB_STATUS,
} from '../../../constants/app-strings';
import { SerialBatchService } from '../../../sync/aggregates/serial-batch/serial-batch.service';
import { DateTime } from 'luxon';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';

@Injectable()
export class StockEntryAggregateService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
    private readonly serialBatchService: SerialBatchService,
    private readonly settingService: SettingsService,
  ) {}

  createStockEntry(payload: StockEntryDto, req) {
    if (payload.status === STOCK_ENTRY_STATUS.draft) {
      return this.saveDraft(payload, req);
    }
    return this.stockEntryPolicies.validateStockEntry(payload, req).pipe(
      switchMap(valid => {
        return this.settingService.find();
      }),
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        return from(this.stockEntryService.create(stockEntry)).pipe(
          switchMap(data => {
            return of(stockEntry);
          }),
        );
      }),
      switchMap(stockEntry => {
        this.batchQueueStockEntry(stockEntry, req, stockEntry.uuid);
        return from(
          this.stockEntryService.updateOne(
            { uuid: stockEntry.uuid },
            { $set: { status: STOCK_ENTRY_STATUS.in_transit } },
          ),
        );
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
      );
    }
    return this.settingService.find().pipe(
      switchMap(settings => {
        const stockEntry = this.setStockEntryDefaults(payload, req, settings);
        stockEntry.status = STOCK_ENTRY_STATUS.draft;
        return from(this.stockEntryService.create(stockEntry));
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
    stockEntry.uuid = uuidv4();
    stockEntry.doctype = STOCK_ENTRY;
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
}
