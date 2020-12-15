import { Injectable, BadRequestException } from '@nestjs/common';
import {
  StockEntryDto,
  StockEntryItemDto,
} from '../../entities/stock-entry-dto';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { switchMap, mergeMap, toArray } from 'rxjs/operators';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import {
  STOCK_ENTRY_STATUS,
  STOCK_ENTRY_TYPE,
} from '../../../constants/app-strings';
import { StockEntry } from '../../entities/stock-entry.entity';

@Injectable()
export class StockEntryPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly settingsService: SettingsService,
  ) {}

  validateStockEntry(payload: StockEntryDto, clientHttpRequest) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        return this.validateStockSerials(
          payload.items,
          payload.stock_entry_type,
          settings,
          clientHttpRequest,
        );
      }),
    );
  }
  validateStockEntryCancel(stockEntry: StockEntry): Observable<StockEntry> {
    if (stockEntry.status !== STOCK_ENTRY_STATUS.delivered) {
      return throwError(
        new BadRequestException(
          `${stockEntry.status} stock entry cannot be canceled`,
        ),
      );
    }

    const message = `${stockEntry.stock_entry_type} stock entry with status ${stockEntry.status} cannot be canceled.`;

    switch (stockEntry.stock_entry_type) {
      case STOCK_ENTRY_TYPE.MATERIAL_TRANSFER:
        return throwError(new BadRequestException(message));

      case STOCK_ENTRY_TYPE.MATERIAL_ISSUE:
        return throwError(new BadRequestException(message));

      case STOCK_ENTRY_TYPE.MATERIAL_RECEIPT:
        return this.validateMaterialReceiptReset(stockEntry);

      default:
        return throwError(new BadRequestException('Invalid Stock Entry'));
    }
  }

  validateMaterialReceiptReset(stockEntry: StockEntry) {
    return forkJoin({
      validateSerialState: this.validateSerialState(stockEntry),
      validateSerials: this.validateMaterialReceiptSerials(stockEntry),
    }).pipe(
      switchMap(valid => {
        return of(stockEntry);
      }),
    );
  }

  validateMaterialReceiptSerials(invoice: StockEntry) {
    return this.serialNoService
      .asyncAggregate([
        {
          $match: {
            purchase_invoice_name: invoice.uuid,
          },
        },
        {
          $project: {
            _id: 1,
            serial_no: 1,
          },
        },
        {
          $lookup: {
            from: 'serial_no_history',
            localField: 'serial_no',
            foreignField: 'serial_no',
            as: 'history',
          },
        },
        { $unwind: '$history' },
        {
          $group: {
            _id: '$serial_no',
            historyEvents: { $sum: 1 },
          },
        },
        {
          $redact: {
            $cond: {
              if: {
                $gt: ['$historyEvents', 1],
              },
              then: '$$KEEP',
              else: '$$PRUNE',
            },
          },
        },
      ])
      .pipe(
        switchMap((data: { _id: string; historyEvents: number }[]) => {
          if (data?.length) {
            const serialEventsMessage = data
              .splice(0, 50)
              .filter(element => `${element._id} has ${element.historyEvents}`)
              .join(', ');
            return throwError(
              new BadRequestException(
                `Found ${data.length} Serials having multiple events : ${serialEventsMessage}..`,
              ),
            );
          }
          return of(invoice);
        }),
      );
  }

  validateSerialState(invoice: StockEntry) {
    return from(
      this.serialNoService.count({
        purchase_invoice_name: invoice.uuid,
        queue_state: { $gt: {} },
      }),
    ).pipe(
      switchMap(count => {
        if (count) {
          return throwError(
            new BadRequestException(
              `Found ${count} serials to be already in queue, please reset queue to proceed.`,
            ),
          );
        }
        return of(invoice);
      }),
    );
  }

  validateStockSerials(
    items: StockEntryItemDto[],
    stock_entry_type: string,
    settings,
    clientHttpRequest,
  ) {
    return from(items).pipe(
      mergeMap(item => {
        if (!item.has_serial_no) {
          return of(true);
        }
        let query: any = {
          serial_no: { $in: item.serial_no },
          item_code: item.item_code,
          warehouse: item.s_warehouse,
          'queue_state.purchase_receipt': { $exists: false },
          $or: [
            {
              'warranty.soldOn': { $exists: false },
              'queue_state.delivery_note': { $exists: false },
            },
            {
              'warranty.claim_no': { $exists: true },
            },
          ],
        };
        if (stock_entry_type === STOCK_ENTRY_TYPE.MATERIAL_RECEIPT) {
          query = {
            serial_no: { $in: item.serial_no },
            $or: [
              { 'queue_state.purchase_receipt': { $exists: true } },
              { 'queue_state.stock_entry': { $exists: true } },
              { purchase_document_no: { $exists: true } },
            ],
          };
        }

        return from(this.serialNoService.count(query)).pipe(
          mergeMap(count => {
            const message = `Found ${count} for Item: ${item.item_name} at warehouse: ${item.s_warehouse}.`;
            if (
              count === item.serial_no.length &&
              [
                STOCK_ENTRY_TYPE.MATERIAL_TRANSFER,
                STOCK_ENTRY_TYPE.MATERIAL_ISSUE,
              ].includes(stock_entry_type)
            ) {
              return of(true);
            }
            if (
              count === 0 &&
              stock_entry_type === STOCK_ENTRY_TYPE.MATERIAL_RECEIPT
            ) {
              return of(true);
            }
            return throwError(new BadRequestException(message));
          }),
        );
      }),
      toArray(),
      switchMap(isValid => {
        return of(true);
      }),
    );
  }
}
