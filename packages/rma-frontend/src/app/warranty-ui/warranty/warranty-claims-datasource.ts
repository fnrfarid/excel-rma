import { DataSource, CollectionViewer } from '@angular/cdk/collections';

import { BehaviorSubject, Observable } from 'rxjs';

export interface ListingData {
  customer: string;
  claim_no: string;
  third_party: string;
  product: string;
  from_date: string;
  claim_status: string;
  claim_type: string;
  branch: string;
  serial: string;
  to_date: string;
}

export interface ListResponse {
  docs: ListingData[];
  length: number;
  offset: number;
}
export class WarrantyClaimsDataSource extends DataSource<ListingData> {
  data: ListingData[];
  length: number;
  offset: number;

  itemSubject = new BehaviorSubject<ListingData[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  connect(collectionViewer: CollectionViewer): Observable<ListingData[]> {
    return this.itemSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(sortOrder?, pageIndex = 0, pageSize = 10, query?) {
    if (!sortOrder) {
      sortOrder = { posting_date: 'desc' };
    }
    this.loadingSubject.next(true);
    const item: ListingData[] = [
      {
        customer: 'Hardik',
        claim_no: '001',
        third_party: 'Yes',
        product: 'TP link router',
        from_date: '20-02-2020',
        claim_status: 'Claimed',
        claim_type: 'Valid',
        branch: 'Finish goods',
        serial: 'ABC123',
        to_date: '20-04-2020',
      },
    ];

    this.itemSubject.next(item);
  }
}
