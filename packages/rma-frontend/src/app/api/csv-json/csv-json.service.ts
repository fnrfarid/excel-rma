import { Injectable } from '@angular/core';
// import { switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';
import * as _ from 'lodash';
import { of, from } from 'rxjs';
import * as CSVTOJSON from 'csvjson-csv2json';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE, DELIVERY_NOTE } from '../../constants/app-string';
import { HttpClient, HttpParams } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
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
    private readonly http: HttpClient,
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
    jsonData.forEach(element => {
      out[element.item_name]
        ? out[element.item_name].serial_no.push(element.serial_no)
        : (out[element.item_name] = { serial_no: [element.serial_no] });
    });
    return out;
  }

  validateSerials(
    item_names: string[],
    itemObj: CsvJsonObj,
    validateFor?: string,
  ) {
    const params = new HttpParams().set(
      'item_names',
      JSON.stringify(item_names),
    );
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get('/api/item/v1/get_by_names', { headers, params })
          .pipe(
            switchMap((response: any[]) => {
              if (response.length === item_names.length) {
                return this.validateSerialsWithItem(itemObj, validateFor).pipe(
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
      }),
    );
  }

  validateSerialsWithItem(itemObj: CsvJsonObj, validateFor?: string) {
    const invalidSerials = [];
    validateFor = validateFor ? validateFor : DELIVERY_NOTE;
    return from(Object.keys(itemObj)).pipe(
      switchMap(key => {
        return this.salesService
          .validateSerials({
            item_code: key,
            serials: itemObj[key].serial_no,
            validateFor,
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
