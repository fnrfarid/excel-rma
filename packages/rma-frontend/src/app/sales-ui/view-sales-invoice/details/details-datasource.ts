import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { Item } from '../../../common/interfaces/sales.interface';
import { SalesService } from '../../services/sales.service';

export class DetailsDataSource extends DataSource<Item> {
  itemSubject = new BehaviorSubject<Item[]>([]);

  constructor(private salesService: SalesService) {
    super();
  }

  connect() {
    return this.itemSubject.asObservable();
  }
  disconnect() {
    this.itemSubject.complete();
  }

  loadItems() {
    this.salesService
      .getItemList()
      .subscribe(items => this.itemSubject.next(items));
  }

  data() {
    return this.itemSubject.value;
  }

  update(data) {
    this.itemSubject.next(data);
  }
}
