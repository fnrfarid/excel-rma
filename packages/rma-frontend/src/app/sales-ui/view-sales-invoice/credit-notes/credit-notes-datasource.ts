import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { WarrantyService } from 'src/app/warranty-ui/warranty-tabs/warranty.service';
import { CollectionViewer } from '@angular/cdk/collections';
import { map, catchError, finalize } from 'rxjs/operators';

export interface CreditNote {
  voucherNo: string;
  invoiceNo: string;
  brand: string;
  date: string;
  amount: number;
  remarks: string;
  createdBy: string;
  submittedBy: string;
}

export class CreditNotesDataSource extends DataSource<CreditNote> {
  data: CreditNote[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<CreditNote[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  constructor(private model: string, private listingService: WarrantyService) {
    super();
  }

  connect(collectionViewer: CollectionViewer): Observable<CreditNote[]> {
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
        map((items: CreditNote[]) => {
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
