import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ServiceInvoiceDetails } from '../warranty-ui/shared-warranty-modules/service-invoices/add-service-invoice/service-invoice-interface';
import { AddServiceInvoiceService } from '../warranty-ui/shared-warranty-modules/service-invoices/add-service-invoice/add-service-invoice.service';

export class ServiceInvoicesDataSource extends DataSource<ServiceInvoiceDetails> {
  data: ServiceInvoiceDetails[];
  length: number;
  offset: number;

  total = new BehaviorSubject<number>(0);

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
      )
      .subscribe(items => {
        this.itemSubject.next(items);
        this.calculateTotal(items);
      });
  }

  calculateTotal(serviceInvoice: ServiceInvoiceDetails[]) {
    let sum = 0;
    serviceInvoice.forEach(item => {
      sum += item.total;
    });
    this.total.next(sum);
  }
}
