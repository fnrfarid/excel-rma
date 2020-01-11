import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { WarrantyService } from '../../../warranty-ui/warranty-tabs/warranty.service';
import { CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';

export interface Account {
  name: string;
  owner: string;
  modified_by: string;
  payment_type: string;
  posting_date: string;
  company: string;
  mode_of_payment: string;
  party_type: string;
  party: string;
  party_balance: string;
  paid_amount: string;
}

export class AccountsDataSource extends DataSource<Account> {
  data: Account[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<Account[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  constructor(private model: string, private listingService: WarrantyService) {
    super();
  }

  connect(collectionViewer: CollectionViewer): Observable<Account[]> {
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
        map((items: Account[]) => {
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
