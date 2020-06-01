import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import {
  SalesInvoice,
  Item,
  APIResponse,
  SerialAssign,
} from '../../common/interfaces/sales.interface';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
  DEFAULT_SELLING_PRICE_LIST,
} from '../../constants/storage';
import {
  LIST_SALES_INVOICE_ENDPOINT,
  SALES_INVOICE_GET_ONE_ENDPOINT,
  LIST_ITEMS_ENDPOINT,
  CREATE_SALES_INVOICE_ENDPOINT,
  SUBMIT_SALES_INVOICE_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  LIST_WAREHOUSE_ENDPOINT,
  LIST_SERIAL_ENDPOINT,
  ASSIGN_SERIAL_ENDPOINT,
  UPDATE_SALES_INVOICE_ENDPOINT,
  RELAY_GET_ITEMPRICE_ENDPOINT,
  GET_SERIAL_ENDPOINT,
  API_INFO_ENDPOINT,
  API_ITEM_GET_BY_CODE,
  GET_USER_PROFILE_ROLES,
  CREATE_SALES_RETURN_ENDPOINT,
  API_TERRITORY_GET_WAREHOUSES,
  RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT,
  RELAY_GET_FULL_ADDRESS_ENDPOINT,
  GET_SALES_INVOICE_DELIVERED_SERIALS_ENDPOINT,
  CANCEL_SALES_INVOICE_ENDPOINT,
  UPDATE_OUTSTANDING_AMOUNT_ENDPOINT,
  RELAY_GET_DELIVERY_NOTE_ENDPOINT,
  VALIDATE_RETURN_SERIALS,
  GET_CUSTOMER_ENDPOINT,
  CUSTOMER_ENDPOINT,
  GET_DOCTYPE_COUNT_METHOD,
} from '../../constants/url-strings';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';
import { StorageService } from '../../api/storage/storage.service';
import { SalesReturn } from '../../common/interfaces/sales-return.interface';
import { JSON_BODY_MAX_SIZE } from '../../constants/app-string';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  salesInvoiceList: Array<SalesInvoice>;
  itemList: Array<Item>;

  constructor(private http: HttpClient, private storage: StorageService) {
    this.salesInvoiceList = [];

    this.itemList = [];
  }

  getItemByItemNames(item_names: string[]) {
    const params = new HttpParams().set(
      'item_names',
      JSON.stringify(item_names),
    );
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get('/api/item/v1/get_by_names', { headers, params });
      }),
    );
  }

  validateSerials(item: {
    item_code: string;
    serials: string[];
    validateFor?: string;
    warehouse?: string;
  }) {
    if (JSON.stringify(item).length < JSON_BODY_MAX_SIZE) {
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http.post('/api/serial_no/v1/validate', item, {
            headers,
          });
        }),
      );
    }
    const blob = new Blob([JSON.stringify(item)], {
      type: 'application/json',
    });

    const uploadData = new FormData();

    uploadData.append('file', blob, 'payload');
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post('/api/serial_no/v1/validate', uploadData, {
          headers,
        });
      }),
    );
  }

  validateReturnSerials(item: {
    item_code: string;
    serials: string[];
    delivery_note_names: string[];
    warehouse: string;
  }) {
    if (JSON.stringify(item).length < JSON_BODY_MAX_SIZE) {
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http.post(VALIDATE_RETURN_SERIALS, item, {
            headers,
          });
        }),
      );
    }
    const blob = new Blob([JSON.stringify(item)], {
      type: 'application/json',
    });

    const uploadData = new FormData();

    uploadData.append('file', blob, 'payload');
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(VALIDATE_RETURN_SERIALS, uploadData, {
          headers,
        });
      }),
    );
  }

  getDeliveredSerials(uuid: string, search: string, offset, limit) {
    const url = GET_SALES_INVOICE_DELIVERED_SERIALS_ENDPOINT;
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', (offset * limit).toString())
      .set('find', uuid)
      .set('search', search);
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }

  getSalesInvoiceList(sortOrder, pageNumber = 0, pageSize = 10, query) {
    if (!sortOrder) sortOrder = { created_on: 'desc' };
    if (!query) query = {};

    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ created_on: 'desc' });
    }

    const url = LIST_SALES_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('filter_query', JSON.stringify(query));

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }

  updateOutstandingAmount(invoice_name: string) {
    const url = `${UPDATE_OUTSTANDING_AMOUNT_ENDPOINT}${invoice_name}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, {}, { headers });
      }),
    );
  }

  getSalesInvoice(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${SALES_INVOICE_GET_ONE_ENDPOINT}${uuid}`, {
          headers,
        });
      }),
    );
  }

  assignSerials(assignSerial: SerialAssign) {
    const url = ASSIGN_SERIAL_ENDPOINT;

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, assignSerial, {
          headers,
        });
      }),
    );
  }

  getItemList(
    filter = {},
    sortOrder: any = { item_name: 'asc' },
    pageIndex = 0,
    pageSize = 10,
  ) {
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch {
      sortOrder = JSON.stringify({ item_name: 'asc' });
    }
    const url = LIST_ITEMS_ENDPOINT;
    const query: any = {};
    query.item_name = filter;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
      .set('search', JSON.stringify(query))
      .set('sort', sortOrder);
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<APIResponse>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.docs);
            }),
            catchError(err => {
              return of(this.itemList);
            }),
          );
      }),
    );
  }

  getDeliveryNoteList(pageNumber?, pageSize?) {
    const url = LIST_SALES_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString());
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }

  createSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = CREATE_SALES_INVOICE_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<SalesInvoice>(url, salesDetails, {
          headers,
        });
      }),
    );
  }

  createSalesReturn(salesReturn: SalesReturn) {
    const url = CREATE_SALES_RETURN_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, salesReturn, {
          headers,
        });
      }),
    );
  }

  updateSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = UPDATE_SALES_INVOICE_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<SalesInvoice>(url, salesDetails, {
          headers,
        });
      }),
    );
  }

  submitSalesInvoice(uuid: string) {
    const url = `${SUBMIT_SALES_INVOICE_ENDPOINT}/${uuid}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, {}, { headers });
      }),
    );
  }

  cancelSalesInvoice(uuid: string) {
    const url = `${CANCEL_SALES_INVOICE_ENDPOINT}/${uuid}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, {}, { headers });
      }),
    );
  }

  getCustomerList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_CUSTOMER_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  relayCustomerList(pageIndex = 0, pageSize = 10, filters) {
    const url = CUSTOMER_ENDPOINT;

    const params = new HttpParams({
      fromObject: {
        fields: '["*"]',
        filters: JSON.stringify(filters),
        limit_page_length: pageSize.toString(),
        limit_start: (pageIndex * pageSize).toString(),
      },
    });
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers, params });
      }),
      map(res => res.data),
    );
  }

  getDoctypeCount(doctype: string, filters) {
    const url = GET_DOCTYPE_COUNT_METHOD;
    const params = new HttpParams({
      fromObject: {
        doctype,
        filters: JSON.stringify(filters),
      },
    });

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers, params });
      }),
      map(res => res.message),
    );
  }

  getSerialList(filter = '', sortOrder = 'asc', pageNumber = 0, pageSize = 10) {
    const url = LIST_SERIAL_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<APIResponse>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.docs);
            }),
          );
      }),
    );
  }

  getSerial(serial_no) {
    const url = `${GET_SERIAL_ENDPOINT}/${serial_no}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any[]>(url, { headers });
      }),
    );
  }

  getWarehouseList(value: string, filter?) {
    const url = LIST_WAREHOUSE_ENDPOINT;
    const params = new HttpParams({
      fromObject: {
        fields: '["*"]',
        filters: filter
          ? filter
          : `[["name","like","%${value}%"],["is_group","=",0]]`,
      },
    });
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<{ territory: string[] }>(GET_USER_PROFILE_ROLES, { headers })
          .pipe(
            switchMap(profile => {
              if (profile.territory && profile.territory.length > 0) {
                const territories = profile.territory;
                let httpParams = new HttpParams();
                territories.forEach(territory => {
                  httpParams = httpParams.append('territories[]', territory);
                });

                return this.http
                  .get<{ warehouses: string[] }>(API_TERRITORY_GET_WAREHOUSES, {
                    headers,
                    params: httpParams,
                  })
                  .pipe(map(res => res.warehouses));
              }
              return this.http
                .get<any>(url, {
                  params,
                  headers,
                })
                .pipe(map(res => res.data));
            }),
          );
      }),
    );
  }

  getDeliveryNoteNames(invoice_name: string) {
    const url = RELAY_GET_DELIVERY_NOTE_ENDPOINT;
    const params = new HttpParams({
      fromObject: {
        filters: `[["against_sales_invoice","=","${invoice_name}"],["status","!=","Cancelled"]]`,
      },
    });
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<any>(url, { params, headers })
          .pipe(map(res => res.data));
      }),
    );
  }

  getAddress(name: string) {
    const getAddressNameURL = RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT;

    const params = new HttpParams()
      .set('doctype', 'Customer')
      .set('name', name);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<any>(getAddressNameURL, { params, headers })
          .pipe(
            map(res => res.message),
            switchMap(address => {
              if (address) {
                const getFullAddressURL =
                  RELAY_GET_FULL_ADDRESS_ENDPOINT + address;
                return this.http
                  .get<any>(getFullAddressURL, { headers })
                  .pipe(map(res => res.data));
              }
              return of({});
            }),
          );
      }),
    );
  }

  getCustomer(name: string) {
    const url = `${GET_CUSTOMER_ENDPOINT}/${name}`;

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers });
      }),
    );
  }

  getItemPrice(item_code: string) {
    const url = RELAY_GET_ITEMPRICE_ENDPOINT;
    return from(this.storage.getItem(DEFAULT_SELLING_PRICE_LIST)).pipe(
      switchMap(priceList => {
        const params = new HttpParams({
          fromObject: {
            fields: '["price_list_rate"]',
            filters: `[["item_code","=","${item_code}"],["price_list","=","${priceList}"]]`,
          },
        });

        return this.getHeaders().pipe(
          switchMap(headers => {
            return this.http
              .get<{ data: { price_list_rate: number }[] }>(url, {
                params,
                headers,
              })
              .pipe(
                switchMap(response => {
                  return of(response.data);
                }),
              );
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

  validateItemList(itemCodeList: string[]) {
    const filteredList = [...new Set(itemCodeList)];
    if (filteredList.length === itemCodeList.length) return true;
    return false;
  }

  getItemFromRMAServer(code: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<Item>(API_ITEM_GET_BY_CODE + '/' + code, {
          headers,
        });
      }),
    );
  }

  getStore() {
    return this.storage;
  }

  getApiInfo() {
    return this.http.get<any>(API_INFO_ENDPOINT);
  }
}
