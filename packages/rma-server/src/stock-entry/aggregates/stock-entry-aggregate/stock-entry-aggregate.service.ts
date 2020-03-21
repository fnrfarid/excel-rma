import { Injectable, Inject } from '@nestjs/common';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryDto } from '../../stock-entry/stock-entry-dto';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { switchMap } from 'rxjs/operators';
import { StockEntry } from '../../stock-entry/stock-entry.entity';
import { from } from 'rxjs';
import { STOCK_ENTRY } from '../../../constants/app-strings';
import * as uuidv4 from 'uuid/v4';
import { CREATE_STOCK_ENTRY_JOB } from '../../schedular/purchase-receipt-sync/purchase-receipt-sync.service';
import * as Agenda from 'agenda';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

@Injectable()
export class StockEntryAggregateService {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly stockEntryService: StockEntryService,
    private readonly stockEntryPolicies: StockEntryPoliciesService,
  ) {}

  create(payload: StockEntryDto, req) {
    return this.stockEntryPolicies.validateStockEntry(payload).pipe(
      switchMap(valid => {
        const stockEntry = this.setStockEntryDefaults(payload, req);
        this.addToQueueNow({ payload: stockEntry, token: req.token });
        return from(this.stockEntryService.create(stockEntry));
      }),
    );
  }

  setStockEntryDefaults(payload: StockEntryDto, clientHttpRequest): StockEntry {
    const stockEntry = new StockEntry();
    Object.assign(stockEntry, payload);
    stockEntry.uuid = uuidv4();
    stockEntry.doctype = STOCK_ENTRY;
    stockEntry.createdOn = payload.posting_date;
    stockEntry.createdByEmail = clientHttpRequest.token.email;
    stockEntry.createdBy = clientHttpRequest.token.fullName;
    stockEntry.isSynced = false;
    stockEntry.inQueue = true;
    stockEntry.docstatus = 1;
    return stockEntry;
  }

  addToQueueNow(data: { payload: any; token: any }) {
    this.agenda
      .now(CREATE_STOCK_ENTRY_JOB, data)
      .then(success => {})
      .catch(err => {});
  }
}
