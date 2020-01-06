import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of } from 'rxjs';

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
  itemSubject = new BehaviorSubject<CreditNote[]>([]);

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
    this.getCreditNoteList().subscribe(creditNote =>
      this.itemSubject.next(creditNote),
    );
  }

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }

  getCreditNoteList() {
    const warrantyList: Array<CreditNote> = [
      {
        voucherNo: 'CN-1234',
        invoiceNo: 'INV#123',
        brand: 'TP-LINK',
        date: '02.01.2020',
        amount: 2000,
        remarks: 'Campaign Offer',
        createdBy: 'Prafful',
        submittedBy: 'Hardik',
      },
    ];

    return of(warrantyList);
  }
}
