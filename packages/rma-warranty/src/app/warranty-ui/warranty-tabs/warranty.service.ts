import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  AUTH_SERVER_URL,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { forkJoin, from } from 'rxjs';
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
} from '../../constants/app-string';
import {
  StockEntryDetails,
  WarrantyClaimsDetails,
  WarrantyPrintDetails,
  WarrantyVouchers,
} from '../../common/interfaces/warranty.interface';
import { AddServiceInvoiceService } from '../shared-warranty-modules/service-invoices/add-service-invoice/add-service-invoice.service';
import { LOAD_FRAPPE_DOCUMENT_METHOD_ENDPOINT } from '../../constants/url-strings';
import { StockEntryService } from '../view-warranty-claims/stock-entry/services/stock-entry/stock-entry.service';
@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  itemList: Array<Item>;

  constructor(
    private http: HttpClient,
    private readonly storage: StorageService,
    private readonly serviceInvoiceService: AddServiceInvoiceService,
    private readonly stockEntryService: StockEntryService,
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

  getServerUrl() {
    return from(this.storage.getItem(AUTH_SERVER_URL));
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
    if (invoice.set === CATEGORY.BULK) {
      return this.getWarrantyClaimsList(
        undefined,
        undefined,
        undefined,
        { parent: invoice.uuid },
        {
          set: ['Part'],
        },
      ).pipe(
        map(res => res.docs),
        switchMap(res => {
          return from(res).pipe(
            concatMap(partClaim => {
              return this.mapClaim(partClaim);
            }),
            toArray(),
          );
        }),
        switchMap(finalBody => {
          return of(finalBody);
        }),
      );
    }
    return this.mapClaim(invoice);
  }

  addressAndContact(doctype: string, customer: string) {
    let address: string = '';
    const params = new HttpParams()
      .set('doctype', doctype)
      .set('name', customer);
    return forkJoin({
      headers: this.getHeaders(),
      authServerUrl: this.getServerUrl(),
    }).pipe(
      switchMap(payload => {
        return this.http.get<any>(`${LOAD_FRAPPE_DOCUMENT_METHOD_ENDPOINT}`, {
          params,
          headers: payload.headers,
        });
      }),
      map(res => res.docs[0]),
      switchMap((customerInfo: any) => {
        ['address_line1', 'address_line2', 'city', 'country'].forEach(key => {
          address += `${
            customerInfo.__onload.addr_list[0] &&
            customerInfo.__onload.addr_list[0][key]
              ? customerInfo.__onload.addr_list[0][key]
              : ''
          } `;
        });
        return of({
          customer_address: address,
          customer_contact:
            customerInfo.__onload.contact_list[0] &&
            customerInfo.__onload.contact_list[0].phone
              ? customerInfo.__onload.contact_list[0].phone
              : '',
        });
      }),
    );
  }

  mapDeliveryNotes(warrantyClaimUuid?: string) {
    return from(
      this.stockEntryService.getStockEntryList(
        undefined,
        undefined,
        undefined,
        {
          stock_entry_type: 'Delivered',
          warrantyClaimUuid,
        },
      ),
    ).pipe(
      switchMap((res: any) => {
        return from(res.docs).pipe(
          concatMap((singleRes: StockEntryDetails) => {
            return of({
              stock_voucher_number: singleRes.stock_voucher_number,
              serial_no:
                singleRes.items[0] && singleRes.items[0].excel_serials
                  ? singleRes.items[0].excel_serials
                  : '',
              item_name:
                singleRes.items[0] && singleRes.items[0].item_name
                  ? singleRes.items[0].item_name
                  : '',
              warranty_end_date:
                singleRes.items[0] && singleRes.items[0].warranty
                  ? singleRes.items[0].warranty.salesWarrantyDate
                  : '',
              warehouse: singleRes.set_warehouse,
              description: singleRes.description,
            });
          }),
        );
      }),
      toArray(),
      switchMap(finalBody => {
        return of(finalBody);
      }),
    );
  }

  mapClaim(invoice: WarrantyClaimsDetails) {
    return of({
      item_name: invoice.item_name,
      serial_no: invoice.serial_no,
      warranty_end_date: invoice.warranty_end_date
        ? invoice.warranty_end_date.toString().split('T')[0]
        : '',
      invoice_no: invoice.invoice_no,
      problem: invoice.problem,
      problem_details: invoice.problem_details,
      remarks: invoice.remarks,
      delivery_status:
        invoice.status_history[invoice.status_history.length - 1].verdict,
      description:
        invoice.status_history[invoice.status_history.length - 1].description,
    });
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
        erpBody.posting_time = invoice.posting_time;
        erpBody.delivery_status = invoice.claim_status;
        return forkJoin({
          finalBody: this.mapWarrantyItems(invoice),
          payload: this.serviceInvoiceService.getServiceInvoiceList(
            JSON.stringify({
              service_vouchers: {
                docstatus: 1,
                invoice_no: { $in: invoice.service_vouchers },
              },
            }),
          ),
          addressContact: this.addressAndContact(
            'Customer',
            invoice.customer_code,
          ),
          delivery_notes: this.mapDeliveryNotes(invoice.uuid),
        });
      }),
      switchMap(res => {
        erpBody.customer_address = res.addressContact.customer_address;
        erpBody.customer_contact = res.addressContact.customer_contact;
        erpBody.delivery_notes = JSON.stringify(res.delivery_notes);
        erpBody.items = JSON.stringify([res.finalBody]);
        return from(res.payload).pipe(
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
          'print',
        ].forEach(key => {
          delete erpBody[key];
        });
        erpBody.status_history = JSON.stringify([
          erpBody.status_history[erpBody.status_history.length - 1],
        ]);
        erpBody.warranty_invoices = JSON.stringify([...warrantyInvoices]);
        return of(erpBody);
      }),
      switchMap((body: WarrantyPrintDetails) => {
        return this.printDocument(body);
      }),
      catchError(err => {
        return of(err);
      }),
    );
  }
}
