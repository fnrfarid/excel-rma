import { Injectable, BadRequestException } from '@nestjs/common';
import {
  StockEntryDto,
  StockEntryItemDto,
} from '../stock-entry/stock-entry-dto';
import { SerialNoService } from '../../serial-no/entity/serial-no/serial-no.service';
import { switchMap } from 'rxjs/operators';
import { from, of, throwError } from 'rxjs';

@Injectable()
export class StockEntryPoliciesService {
  constructor(private readonly serialNoService: SerialNoService) {}

  validateStockEntry(payload: StockEntryDto) {
    return this.validateStockSerials(payload.items).pipe(
      switchMap(isValid => {
        return of(isValid);
      }),
    );
  }

  validateStockSerials(items: StockEntryItemDto[]) {
    return from(items).pipe(
      switchMap(item => {
        return from(
          this.serialNoService.count({
            serial_no: { $in: item.serial_no },
            warehouse: item.s_warehouse,
            item_code: item.item_code,
          }),
        ).pipe(
          switchMap(count => {
            if (count === item.serial_no.length) {
              return of(true);
            }
            return throwError(
              new BadRequestException(
                `Expected ${item.serial_no.length} serials for Item: ${item.item_name} at warehouse: ${item.s_warehouse}, found ${count}.`,
              ),
            );
          }),
        );
      }),
    );
  }
}
