import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import {
  map,
  catchError,
  finalize,
  concatMap,
  switchMap,
  toArray,
} from 'rxjs/operators';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDetails } from './add-service-invoice/service-invoice-interface';

export class ServiceInvoiceDataSource extends DataSource<ServiceInvoiceDetails> {
  data: ServiceInvoiceDetails[];
  length: number;
  offset: number;

  total = new BehaviorSubject<number>(0);

  itemSubject = new BehaviorSubject<ServiceInvoiceDetails[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);
  disableRefresh = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private serviceInvoice: AddServiceInvoiceService) {
    super();
  }

  connect(
    collectionViewer: CollectionViewer,
  ): Observable<ServiceInvoiceDetails[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(filter = '', sortOrder?, pageIndex = 0, pageSize = 30) {
    this.loadingSubject.next(true);
    this.serviceInvoice
      .getServiceInvoiceList(filter, sortOrder, pageIndex, pageSize)
      .pipe(
        map((serviceInvoice: ServiceInvoiceDetails[]) => {
          this.data = serviceInvoice;
          this.offset = (pageIndex + 1) * pageSize;
          this.length = serviceInvoice.length;
          return serviceInvoice;
        }),
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false)),
        switchMap(items => {
          return from(items).pipe(
            concatMap(item => {
              return this.serviceInvoice.updateDocStatus(item.invoice_no).pipe(
                switchMap((res: { docstatus: number }) => {
                  item.docstatus = res.docstatus;
                  return of(item);
                }),
              );
            }),
            toArray(),
          );
        }),
      )
      .subscribe(items => {
        this.itemSubject.next(items);
        this.calculateTotal(items);
      });
  }

  syncDocStatus() {
    this.disableRefresh.next(true);
    return from(this.itemSubject.value).pipe(
      concatMap(item => {
        return this.serviceInvoice.updateDocStatus(item.invoice_no).pipe(
          switchMap((res: { docstatus: number }) => {
            item.docstatus = res.docstatus;
            return of(item);
          }),
        );
      }),
      toArray(),
      switchMap(items => {
        this.disableRefresh.next(false);
        this.itemSubject.next(items);
        this.calculateTotal(items);
        return of({});
      }),
    );
  }

  calculateTotal(serviceInvoice: ServiceInvoiceDetails[]) {
    let sum = 0;
    serviceInvoice.forEach(item => {
      sum += item.total;
    });
    this.total.next(sum);
  }
}
