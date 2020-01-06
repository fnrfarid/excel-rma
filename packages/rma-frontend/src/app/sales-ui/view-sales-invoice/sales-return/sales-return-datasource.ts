import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of } from 'rxjs';

export interface SalesReturn {
  voucherNo: string;
  amount: number;
  date: string;
  remark: string;
  createdBy: string;
  submittedBy: string;
}

export class SalesReturnDataSource extends DataSource<SalesReturn> {
  itemSubject = new BehaviorSubject<SalesReturn[]>([]);

  constructor() {
    super();
  }

  connect() {
    return this.itemSubject.asObservable();
  }
  disconnect() {
    this.itemSubject.complete();
  }

  loadItems() {
    this.getSalesReturnsList().subscribe(salesReturn =>
      this.itemSubject.next(salesReturn),
    );
  }

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }

  getSalesReturnsList() {
    const salesReturnsList: Array<SalesReturn> = [
      {
        voucherNo: 'RINV-001',
        date: '04.01.2020',
        amount: 500000,
        remark: 'Product damaged',
        createdBy: 'Prafful',
        submittedBy: 'Hardik',
      },
    ];

    return of(salesReturnsList);
  }
}
