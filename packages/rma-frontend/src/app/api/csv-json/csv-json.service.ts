import { Injectable } from '@angular/core';
// import { switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';
import * as _ from 'lodash';
import { of, from, throwError } from 'rxjs';
import * as CSVTOJSON from 'csvjson-csv2json';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CLOSE,
  DELIVERY_NOTE,
  PURCHASE_RECEIPT,
} from '../../constants/app-string';
import {
  switchMap,
  map,
  concatMap,
  catchError,
  toArray,
  bufferCount,
} from 'rxjs/operators';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  VALIDATE_SERIAL_BUFFER_COUNT,
} from '../../constants/storage';
import { StorageService } from '../storage/storage.service';
import { CsvJsonObj } from '../../sales-ui/view-sales-invoice/serials/serials.component';
import { SalesService } from '../../sales-ui/services/sales.service';

@Injectable({
  providedIn: 'root',
})
export class CsvJsonService {
  arrayBuffer;
  constructor(
    private readonly snackBar: MatSnackBar,
    private storage: StorageService,
    private readonly salesService: SalesService,
  ) {}

  // give a file buffer from file-input as event.target.files[0]

  csvToJSON(csvPayload) {
    return of(CSVTOJSON.csv2json(csvPayload, { parseNumbers: true }));
  }

  validateHeaders(licenseHeaders: string[]) {
    const notFound = _.differenceWith(licenseHeaders, FILE_HEADERS, _.isEqual)
      .length;
    if (notFound) {
      this.snackBar.open(
        `Invalid header,expected ${FILE_HEADERS.join(
          ', ',
        )} found ${licenseHeaders.join(', ')} please add them to 1st row.`,
        CLOSE,
        { duration: 4500 },
      );
      return false;
    }
    return true;
  }

  mapJson(jsonData: { item_name: string; serial_no: string }[]) {
    const out = {};
    _.forEach(jsonData, element => {
      if (out[element.item_name]) {
        out[element.item_name].serial_no.push(
          element.serial_no.toString().toUpperCase(),
        );
        return;
      }
      out[element.item_name] = {
        serial_no: [element.serial_no.toString().toUpperCase()],
      };
    });
    return out;
  }

  validateReturnSerials(
    item_names: string[],
    itemObj: CsvJsonObj,
    delivery_note_names: string[],
    warehouse: string,
  ) {
    return this.salesService.getItemByItemNames(item_names).pipe(
      switchMap((response: any[]) => {
        if (response.length === item_names.length) {
          return this.validateReturnSerialsWithItem(
            itemObj,
            delivery_note_names,
            warehouse,
          ).pipe(
            switchMap(isValid => {
              if (isValid.length) {
                this.snackBar.open(
                  `${isValid.length} Invalid Serials: ${isValid
                    .splice(0, 5)
                    .join(', ')}`,
                  CLOSE,
                  { duration: 2500 },
                );
                return of(false);
              }
              return of(true);
            }),
          );
        }
        this.snackBar.open(
          `Item not found :
              ${_.differenceWith(
                item_names,
                response.map(element => {
                  return item_names.includes(element.item_name)
                    ? element.item_name
                    : undefined;
                }),
                _.isEqual,
              ).join(', ')}`,
          CLOSE,
          { duration: 2500 },
        );
        return of(false);
      }),
    );
  }

  validateSerials(
    item_names: string[],
    itemObj: CsvJsonObj,
    validateFor?: string,
    warehouse?: string,
  ) {
    return this.salesService.getItemByItemNames(item_names).pipe(
      switchMap((response: any[]) => {
        if (response.length === item_names.length) {
          return validateFor === PURCHASE_RECEIPT
            ? this.validateIfSerialExists(itemObj, validateFor)
            : this.validateSerialsWithItem(itemObj, validateFor, warehouse);
        }
        this.itemNotFound(response, item_names);
        return of(false);
      }),
      toArray(),
      switchMap(success => {
        return of(true);
      }),
      catchError(err => {
        if (err && err.error && err.error.message) {
          this.snackBar.open(err.error.message, CLOSE, { duration: 2500 });
        } else {
          this.snackBar.open(
            `Found ${
              validateFor === PURCHASE_RECEIPT ? `${err.length}+` : ''
            } Invalid Serials: ${err.splice(0, 5).join(', ')}..`,
            CLOSE,
            { duration: 2500 },
          );
        }
        return of(false);
      }),
    );
  }

  itemNotFound(items, item_names: string[]) {
    this.snackBar.open(
      `Item not found :
          ${_.differenceWith(
            item_names,
            items.map(element => {
              return item_names.includes(element.item_name)
                ? element.item_name
                : undefined;
            }),
            _.isEqual,
          ).join(', ')}`,
      CLOSE,
      { duration: 2500 },
    );
  }

  validateSerialsWithItem(
    itemObj: CsvJsonObj,
    validateFor?: string,
    warehouse?: string,
  ) {
    const invalidSerials = [];
    return from(Object.keys(itemObj)).pipe(
      switchMap(key => {
        return from(itemObj[key].serial_no).pipe(
          bufferCount(VALIDATE_SERIAL_BUFFER_COUNT),
          concatMap((serialBatch: string[]) => {
            return this.salesService.validateSerials({
              item_code: key,
              serials: serialBatch,
              validateFor,
            });
          }),
          switchMap((data: { notFoundSerials: string[] }) => {
            invalidSerials.push(...data.notFoundSerials);
            if (invalidSerials.length) {
              return throwError(invalidSerials);
            }
            return of(true);
          }),
        );
      }),
    );
  }

  validateReturnSerialsWithItem(
    itemObj: CsvJsonObj,
    delivery_note_names,
    warehouse,
  ) {
    const invalidSerials = [];
    return from(Object.keys(itemObj)).pipe(
      switchMap(key => {
        return this.salesService
          .validateReturnSerials({
            item_code: key,
            serials: itemObj[key].serial_no,
            delivery_note_names,
            warehouse,
          })
          .pipe(
            switchMap((data: { notFoundSerials: string[] }) => {
              invalidSerials.push(...data.notFoundSerials);
              return of(invalidSerials);
            }),
          );
      }),
    );
  }

  validateIfSerialExists(itemObj: CsvJsonObj, validateFor?: string) {
    const invalidSerials = [];
    let serials = [];
    Object.keys(itemObj).forEach(item => {
      serials = _.concat(serials, itemObj[item].serial_no);
    });
    validateFor = validateFor ? validateFor : DELIVERY_NOTE;
    return from(serials).pipe(
      bufferCount(VALIDATE_SERIAL_BUFFER_COUNT),
      concatMap((serialBatch: string[]) => {
        return this.salesService.validateSerials({
          item_code: '',
          serials: serialBatch,
          validateFor,
        });
      }),
      switchMap((data: { notFoundSerials: string[] }) => {
        invalidSerials.push(...data.notFoundSerials);
        if (invalidSerials.length) {
          return throwError(invalidSerials);
        }
        return of(true);
      }),
    );
  }

  getHeaders() {
    return from(this.storage.getItem(ACCESS_TOKEN)).pipe(
      map(token => {
        return {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
        };
      }),
    );
  }
}

export const FILE_HEADERS = ['item_name', 'serial_no'];
