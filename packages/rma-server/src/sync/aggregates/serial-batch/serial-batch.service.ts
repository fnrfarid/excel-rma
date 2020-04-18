import { Injectable } from '@nestjs/common';
import { from, of } from 'rxjs';
import { concatMap, bufferCount, mergeMap } from 'rxjs/operators';

@Injectable()
export class SerialBatchService {
  constructor() {}

  batchItems(itemsArray: ItemBatchInterface[], batchSize: number) {
    return from(itemsArray).pipe(
      concatMap(item => {
        return this.batchSingleItem(item, batchSize);
      }),
    );
  }

  batchSingleItem(item: ItemBatchInterface, batchSize: number) {
    const serials = item.serial_no;
    delete item.serial_no;
    return from(serials).pipe(
      concatMap(serial => {
        return of(serial);
      }),
      bufferCount(batchSize),
      mergeMap(batchSerial => {
        const singleBatch: { serial_no?: any; qty?: number } = {};
        Object.assign(singleBatch, item);
        singleBatch.qty = batchSerial.length;
        singleBatch.serial_no = batchSerial.join('\n');
        return of(singleBatch);
      }),
    );
  }
}

export class ItemBatchInterface {
  item_code: string;
  serial_no: string[];
  has_serial_no: number;
}
