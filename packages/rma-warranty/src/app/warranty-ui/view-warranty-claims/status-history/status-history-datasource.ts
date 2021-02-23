import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { StatusHistoryService } from './status-history.service';
import {
  StatusHistoryDetails,
  WarrantyClaimsDetails,
} from '../../../common/interfaces/warranty.interface';

export class StatusHistoryDataSource extends DataSource<StatusHistoryDetails> {
  data: StatusHistoryDetails[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<StatusHistoryDetails[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  constructor(private readonly statusHistoryService: StatusHistoryService) {
    super();
  }

  connect(
    collectionViewer: CollectionViewer,
  ): Observable<StatusHistoryDetails[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(uuid) {
    this.loadingSubject.next(true);
    this.statusHistoryService
      .getWarrantyDetail(uuid)
      .pipe(
        map((items: WarrantyClaimsDetails) => {
          this.data = items.status_history;
          return this.data;
        }),
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe(items => this.itemSubject.next(items));
  }

  getData() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }
}
