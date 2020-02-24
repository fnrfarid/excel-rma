import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SalesService } from '../services/sales.service';

export interface ListingData {
  uuid: string;
  customer: string;
  submitted: boolean;
  status: string;
  total: number;
}

export interface ListResponse {
  docs: ListingData[];
  length: number;
  offset: number;
}
export class SalesInvoiceDataSource extends DataSource<ListingData> {
  data: ListingData[];
  length: number;
  offset: number;
  total = new BehaviorSubject<number>(0);
  itemSubject = new BehaviorSubject<ListingData[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  constructor(private salesService: SalesService) {
    super();
  }

  connect(collectionViewer: CollectionViewer): Observable<ListingData[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(sortOrder?, pageIndex = 0, pageSize = 10, query?) {
    if (!sortOrder) {
      sortOrder = { created_on: 'desc' };
    }
    this.loadingSubject.next(true);
    this.salesService
      .getSalesInvoiceList(sortOrder, pageIndex, pageSize, query)
      .pipe(
        map((res: ListResponse) => {
          this.data = res.docs;
          this.offset = res.offset;
          this.length = res.length;
          return res.docs;
        }),
        catchError(error => of([])),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe(items => {
        this.calculateTotal(items);
        this.itemSubject.next(items);
      });
  }

  calculateTotal(salesInvoices: ListingData[]) {
    let sum = 0;
    salesInvoices.forEach(item => {
      sum += item.total;
    });
    this.total.next(sum);
  }
}
