import { DataSource } from '@angular/cdk/table';
import { draftList } from '../../common/interfaces/sales.interface';
import { BehaviorSubject } from 'rxjs';
// import { SalesService } from '../services/sales.service';

// export interface

export class DraftsDataSource extends DataSource<draftList> {
  itemSubject = new BehaviorSubject<draftList[]>([]);

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