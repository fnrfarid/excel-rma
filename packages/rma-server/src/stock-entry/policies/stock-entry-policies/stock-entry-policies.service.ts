import { Injectable, BadRequestException } from '@nestjs/common';
import {
  StockEntryDto,
  StockEntryItemDto,
} from '../../stock-entry/stock-entry-dto';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { switchMap, mergeMap, toArray } from 'rxjs/operators';
import { from, of, throwError } from 'rxjs';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { STOCK_ENTRY_TYPE } from '../../../constants/app-strings';
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
