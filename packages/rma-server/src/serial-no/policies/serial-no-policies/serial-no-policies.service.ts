import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import {
  SerialNoDto,
  ValidateSerialsDto,
} from '../../entity/serial-no/serial-no-dto';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  SERIAL_NO_ALREADY_EXIST,
  ITEM_NOT_FOUND,
  SUPPLIER_NOT_FOUND,
} from '../../../constants/messages';
import { ItemService } from '../../../item/entity/item/item.service';
import { SupplierService } from '../../../supplier/entity/supplier/supplier.service';

@Injectable()
export class SerialNoPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly itemService: ItemService,
    private readonly supplierService: SupplierService,
  ) {}

  validateSerial(serialProvider: SerialNoDto) {
    return from(
      this.serialNoService.findOne({ serial_no: serialProvider.serial_no }),
    ).pipe(
      switchMap(serial => {
        if (!serial) {
          return of(true);
        }
        return throwError(new BadRequestException(SERIAL_NO_ALREADY_EXIST));
      }),
    );
  }

  validateItem(serialProvider: SerialNoDto) {
    return from(
      this.itemService.findOne({ item_code: serialProvider.item_code }),
    ).pipe(
      switchMap(item => {
        if (item) {
          return of(true);
        }
        return throwError(new NotFoundException(ITEM_NOT_FOUND));
      }),
    );
  }

  validateSupplier(serialProvider: SerialNoDto) {
    return from(
      this.supplierService.findOne({ name: serialProvider.supplier }),
    ).pipe(
      switchMap(supplier => {
        if (supplier) {
          return of(true);
        }
        return throwError(new NotFoundException(SUPPLIER_NOT_FOUND));
      }),
    );
  }

  validateCompany(serialProvider: SerialNoDto) {
    // validate company
  }

  validateSerials(payload: ValidateSerialsDto) {
    return this.serialNoService
      .asyncAggregate([
        {
          $match: {
            serial_no: { $in: payload.serials },
            item_code: payload.item_code,
          },
        },
        {
          $group: {
            _id: 'validSerials',
            foundSerials: { $push: '$serial_no' },
          },
        },
        {
          $project: {
            notFoundSerials: {
              $setDifference: [payload.serials, '$foundSerials'],
            },
          },
        },
      ])
      .pipe(
        switchMap((data: { _id: string; notFoundSerials: string[] }[]) => {
          return of({
            notFoundSerials: data[0]
              ? data[0].notFoundSerials
              : payload.serials,
          });
        }),
      );
  }
}
