import {
  Injectable,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  PLEASE_SETUP_DEFAULT_COMPANY,
  INVALID_COMPANY,
  SALES_INVOICE_NOT_FOUND,
  SERIAL_SHOULD_BE_EQUAL_TO_QUANTITY,
  SERIAL_NO_NOT_FOUND,
  INVALID_ITEM,
  INVALID_ITEM_CODE,
} from '../../../constants/messages';
import { ItemService } from '../../../item/entity/item/item.service';
import { AssignSerialDto } from '../../entity/serial-no/assign-serial-dto';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';

@Injectable()
export class AssignSerialNoPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly settingsService: SettingsService,
    private readonly itemService: ItemService,
    private readonly salesInvoiceService: SalesInvoiceService,
  ) {}

  validateSerial(serialProvider: AssignSerialDto) {
    return from(
      this.salesInvoiceService.findOne({
        name: serialProvider.sales_invoice_name,
      }),
    ).pipe(
      switchMap(salesInvoice => {
        if (!salesInvoice) {
          return throwError(new BadRequestException(SALES_INVOICE_NOT_FOUND));
        }
        return this.settingsService.find().pipe(
          switchMap(settings => {
            const [serial_no, item] = [new Set(), new Set()];
            let total_qty = 0;

            serialProvider.items.forEach(element => {
              if (element.has_serial_no) {
                item.add(element.item_code);
                total_qty += element.qty;
                element.serial_no.forEach(serial => {
                  serial_no.add(serial);
                });
              }
            });

            const item_array: any[] = Array.from(item);
            const serial_no_array: any[] = Array.from(serial_no);

            if (!settings.defaultCompany) {
              return throwError(
                new NotImplementedException(PLEASE_SETUP_DEFAULT_COMPANY),
              );
            }

            if (total_qty !== serial_no_array.length) {
              return throwError(
                new BadRequestException(
                  this.getMessage(
                    SERIAL_SHOULD_BE_EQUAL_TO_QUANTITY,
                    total_qty,
                    serial_no_array.length,
                  ),
                ),
              );
            }

            if (serialProvider.company !== settings.defaultCompany) {
              return throwError(new BadRequestException(INVALID_COMPANY));
            }

            return from(
              this.serialNoService.count({
                serial_no: { $in: serial_no_array },
              }),
            ).pipe(
              switchMap((serial: any) => {
                if (serial !== serial_no_array.length) {
                  return throwError(
                    new BadRequestException(
                      this.getMessage(
                        SERIAL_NO_NOT_FOUND,
                        serial_no_array.length,
                        serial,
                      ),
                    ),
                  );
                }
                return this.validateItem(item_array);
              }),
            );
          }),
        );
      }),
    );
  }

  validateItem(item: string[]) {
    return from(this.itemService.count({ item_code: { $in: item } })).pipe(
      switchMap((itemCount: any) => {
        if (itemCount !== item.length) {
          return throwError(
            new BadRequestException(
              this.getMessage(
                `${INVALID_ITEM}, ${INVALID_ITEM_CODE}`,
                item.length,
                itemCount,
              ),
            ),
          );
        }
        return of(true);
      }),
    );
  }

  getMessage(notFoundMessage, expected, found) {
    return `${notFoundMessage}, expected ${expected || 0} found ${found || 0}`;
  }
}
