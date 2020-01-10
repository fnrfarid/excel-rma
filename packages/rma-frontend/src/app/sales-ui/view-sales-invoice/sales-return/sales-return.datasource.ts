import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WarrantyService } from '../../../warranty-ui/warranty-tabs/warranty.service';

export interface ListingData {
  name: string;
  posting_date: string;
  title: string;
  total: string;
  status: string;
  owner: string;
  modified_by: string;
}

export class SalesReturnDataSource extends DataSource<ListingData> {
  data: ListingData[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<ListingData[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  constructor(private model: string, private listingService: WarrantyService) {
    super();
  }

  connect(collectionViewer: CollectionViewer): Observable<ListingData[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(filter = '', sortOrder = 'asc', pageIndex = 0, pageSize = 10) {
    this.loadingSubject.next(true);
    this.listingService
      .findModels(this.model, filter, sortOrder, pageIndex, pageSize)
      .pipe(
        map((items: ListingData[]) => {
          this.data = items;
          this.offset = (pageIndex + 1) * pageSize;
          this.length = items.length;
          return items;
        }),
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe(items => this.itemSubject.next(items));
  }
}
