import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  AUTH_SERVER_URL,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { from } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { StorageService } from '../../api/storage/storage.service';
import {
  SYNC_WARRANTY_INVOICE_ENDPOINT,
  LIST_WARRANTY_INVOICE_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
  RESET_WARRANTY_CLAIM_ENDPOINT,
  REMOVE_WARRANTY_CLAIM_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  LIST_ITEMS_ENDPOINT,
  RELAY_LIST_PRINT_FORMAT_ENDPOINT,
  PRINT_SALES_INVOICE_PDF_METHOD,
} from '../../constants/url-strings';
import { APIResponse, Item } from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
import {
  CATEGORY,
  CLAIM_STATUS,
  DELIVERY_TOKEN,
  EXCEL_WARRANTY_PRINT,
  SERVICE_TOKEN,
} from 'src/app/constants/app-string';
import {
  WarrantyClaimsDetails,
  WarrantyPrintDetails,
  WarrantyPrintItems,
  WarrantyVouchers,
} from 'src/app/common/interfaces/warranty.interface';
import { AddServiceInvoiceService } from '../shared-warranty-modules/service-invoices/add-service-invoice/add-service-invoice.service';
@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  itemList: Array<Item>;

  constructor(
    private http: HttpClient,
    private readonly storage: StorageService,
    private readonly serviceInvoiceService: AddServiceInvoiceService,
  ) {
    this.itemList = [];
  }

  findModels(
    model: string,
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 30,
  ) {
    const url = `api/${model}/v1/list`;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }
  getWarrantyClaimsList(
    sortOrder,
    pageNumber = 0,
    pageSize = 30,
    query,
    territory?,
  ) {
    if (!sortOrder) sortOrder = { createdOn: 'desc' };
    if (!query) query = {};
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ createdOn: 'desc' });
    }
    const url = LIST_WARRANTY_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('filter_query', JSON.stringify(query))
      .set('territories', JSON.stringify(territory));

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  getWarrantyClaim(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${WARRANTY_CLAIM_GET_ONE_ENDPOINT}${uuid}`, {
          headers,
        });
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

  getCustomerList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 30,
  ) {
    const url = LIST_CUSTOMER_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', encodeURIComponent(filter))
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
      map(res => res.docs),
    );
  }

  getItemList(
    filter: any = {},
    sortOrder: any = { item_name: 'asc' },
    pageIndex = 0,
    pageSize = 30,
    query?: { [key: string]: any },
  ) {
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch {
      sortOrder = JSON.stringify({ item_name: 'asc' });
    }
    const url = LIST_ITEMS_ENDPOINT;
    query = query ? query : {};
    query.item_name = filter?.item_name ? filter.item_name : filter;
    query.disabled = 0;

    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
      .set('search', encodeURIComponent(JSON.stringify(query)))
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

  getPrintFormats(name: string = '') {
    return switchMap(value => {
      if (!value) value = '';
      const url = RELAY_LIST_PRINT_FORMAT_ENDPOINT;
      const params = new HttpParams({
        fromObject: {
          fields: `["name"]`,
          filters: value
            ? `[["doc_type", "=", "${EXCEL_WARRANTY_PRINT}"],["name","like","%${value}%"]]`
            : `[["doc_type", "=", "${EXCEL_WARRANTY_PRINT}"],["name","like","%''%"]]`,
        },
      });
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http
            .get<{ data: unknown[] }>(url, {
              headers,
              params,
            })
            .pipe(map(res => res.data));
        }),
      );
    });
  }

  getStorage() {
    return this.storage;
  }

  printDocument(doc) {
    const blob = new Blob([JSON.stringify(doc)], {
      type: 'application/json',
    });
    const uploadData = new FormData();
    uploadData.append('file', blob, 'purchase_receipts');
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(SYNC_WARRANTY_INVOICE_ENDPOINT, uploadData, {
          headers,
          responseType: 'arraybuffer',
        });
      }),
    );
  }

  resetClaim(uuid: string, serial_no?: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<any>(
          `${RESET_WARRANTY_CLAIM_ENDPOINT}`,
          { uuid, serial_no },
          { headers },
        );
      }),
    );
  }

  removeClaim(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<any>(
          `${REMOVE_WARRANTY_CLAIM_ENDPOINT}${uuid}`,
          {},
          { headers },
        );
      }),
    );
  }

  openPdf(format, uuid) {
    this.getStorage()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        window.open(
          `${auth_url}${PRINT_SALES_INVOICE_PDF_METHOD}?doctype=${EXCEL_WARRANTY_PRINT}` +
            `&name=${uuid}` +
            `&format=${format.name}` +
            `&no_letterhead=0` +
            `&_lang=en`,
          '_blank',
        );
      });
  }

  mapWarrantyItems(invoice: WarrantyClaimsDetails) {
    const array: WarrantyPrintItems[] = [];
    if (invoice.set === CATEGORY.BULK) {
      return [...invoice.bulk_products];
    }
    return [
      ...array,
      {
        item_name: invoice.item_name,
        serial_no: invoice.serial_no,
        warranty_end_date: invoice.warranty_end_date,
      },
    ];
  }

  generateWarrantyPrintBody(uuid: string) {
    const erpBody = {} as WarrantyPrintDetails;
    return this.getWarrantyClaim(uuid).pipe(
      switchMap((invoice: WarrantyClaimsDetails) => {
        invoice.service_vouchers = invoice.service_vouchers
          ? invoice.service_vouchers
          : [];
        Object.assign(erpBody, invoice);
        switch (invoice.claim_status) {
          case CLAIM_STATUS.DELIVERED:
            erpBody.print_type = DELIVERY_TOKEN;
            break;

          default:
            erpBody.print_type = SERVICE_TOKEN;
            break;
        }
        erpBody.name = invoice.uuid;
        erpBody.delivery_status = invoice.claim_status;
        erpBody.items = JSON.stringify(this.mapWarrantyItems(invoice));
        return from(
          this.serviceInvoiceService.getServiceInvoiceList(
            JSON.stringify({
              service_vouchers: {
                invoice_no: { $in: invoice.service_vouchers },
              },
            }),
          ),
        );
      }),
      switchMap(res => {
        return from(res).pipe(
          concatMap(singleVoucher => {
            return of({
              voucher_number: singleVoucher.invoice_no,
              description: singleVoucher.items[0].item_name,
              amount: singleVoucher.total,
              paid: singleVoucher.total,
              unpaid: singleVoucher.total - singleVoucher.total,
            });
          }),
          toArray(),
        );
      }),
      switchMap((warrantyInvoices: WarrantyVouchers[]) => {
        [
          'progress_state',
          'completed_delivery_note',
          'set',
          'damaged_serial',
          'damage_warehouse',
          'damage_product',
          'category',
          'service_items',
          'service_vouchers',
          'bulk_products',
          'status_history',
          'print',
        ].forEach(key => {
          delete erpBody[key];
        });
        erpBody.warranty_invoices = JSON.stringify([...warrantyInvoices]);
        return of(erpBody);
      }),
      switchMap((body: WarrantyPrintDetails) => {
        return this.printDocument(body);
      }),
    );
  }
}
