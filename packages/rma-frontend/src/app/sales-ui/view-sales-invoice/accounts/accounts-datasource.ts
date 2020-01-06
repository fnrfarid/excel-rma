import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of } from 'rxjs';

export interface Account {
  voucherNo: string;
  voucherType: string;
  amount: number;
  dated: string;
  remark: string;
}

export class AccountsDataSource extends DataSource<Account> {
  itemSubject = new BehaviorSubject<Account[]>([]);

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
    this.getAccountList().subscribe(account => this.itemSubject.next(account));
  }

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }

  getAccountList() {
    const accountList: Array<Account> = [
      {
        voucherNo: 'RV-0001',
        voucherType: 'Cash',
        dated: '04.01.2020',
        amount: 500000,
        remark: '',
      },
      {
        voucherNo: 'RV-0002',
        voucherType: 'Cheque',
        dated: '05.01.2020',
        amount: 550000,
        remark: 'For the project',
      },
    ];

    return of(accountList);
  }
}
