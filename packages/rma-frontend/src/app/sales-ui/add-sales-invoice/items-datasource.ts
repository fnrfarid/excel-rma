import { DataSource } from '@angular/cdk/table';
import { Item } from '../../common/interfaces/sales.interface';
import { BehaviorSubject } from 'rxjs';
// import { SalesService } from '../services/sales.service';

// export interface

export class ItemsDataSource extends DataSource<Item> {
  itemSubject = new BehaviorSubject<Item[]>([]);

  constructor() {
    super();
  }

  connect() {
    return this.itemSubject.asObservable();
  }
  disconnect() {
    this.itemSubject.complete();
  }

  loadItems() {}

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }
}