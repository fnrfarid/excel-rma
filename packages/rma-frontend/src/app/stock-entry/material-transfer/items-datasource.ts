import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';

export class StockTransferItem {
  item_name: string;
  item_code: string;
  assigned: number;
  has_serial_no: boolean;
}

export class StockItemsDataSource extends DataSource<StockTransferItem> {
  itemSubject = new BehaviorSubject<StockTransferItem[]>([]);

  constructor() {
    super();
  }

  connect() {
    return this.itemSubject.asObservable();
  }
  disconnect() {
    this.itemSubject.complete();
  }

  loadItems(items) {
    this.itemSubject.next(items);
  }

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }
}
