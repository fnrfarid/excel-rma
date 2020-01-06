import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoDto } from '../../entity/serial-no/serial-no-dto';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  SERIAL_NO_ALREADY_EXIST,
  ITEM_NOT_FOUND,
} from '../../../constants/messages';
import { ItemService } from '../../../item/entity/item/item.service';

@Injectable()
export class SerialNoPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly itemService: ItemService,
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

  validateCompany(serialProvider: SerialNoDto) {
    // validate company
  }
}
