import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { SerialSearchFields } from './search-fields.interface';
import { SerialSearchService } from './serial-search.service';

export interface ListResponse {
  docs: SerialSearchFields[];
  length: number;
  offset: number;
}
export class SerialSearchDataSource extends DataSource<SerialSearchFields> {
  data: SerialSearchFields[];
  length: number;
  offset: number;
  total = new BehaviorSubject<number>(0);
  itemSubject = new BehaviorSubject<SerialSearchFields[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();
  constructor(private serialSearchService: SerialSearchService) {
    super();
  }
  connect(
    collectionViewer: CollectionViewer,
  ): Observable<SerialSearchFields[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(sortOrder?, pageIndex = 0, pageSize = 30, query?) {
    if (!sortOrder) {
      sortOrder = { serial_no: 'asc' };
    }
    this.loadingSubject.next(true);
    this.serialSearchService
      .getSerialsList(sortOrder, pageIndex, pageSize, query)
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
        this.itemSubject.next(items);
      });
  }
}
