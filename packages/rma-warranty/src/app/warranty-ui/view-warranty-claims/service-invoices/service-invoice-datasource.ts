import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDetails } from './add-service-invoice/service-invoice-interface';

export class ServiceInvoiceDataSource extends DataSource<
  ServiceInvoiceDetails
> {
  data: ServiceInvoiceDetails[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<ServiceInvoiceDetails[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

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

  loadItems(filter = '', sortOrder?, pageIndex = 0, pageSize = 10) {
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
      )
      .subscribe(items => this.itemSubject.next(items));
  }
}
