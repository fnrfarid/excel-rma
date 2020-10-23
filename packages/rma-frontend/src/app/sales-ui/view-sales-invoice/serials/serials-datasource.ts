import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, of } from 'rxjs';
import { SerialItem, Item } from './serials.component';
import { SalesService } from '../../services/sales.service';
import { map, catchError, finalize } from 'rxjs/operators';
import { APIResponse } from '../../../purchase-ui/view-purchase-invoice/purchase-assign-serials/purchase-serials-datasource';

export class SerialDataSource extends DataSource<SerialItem> {
  itemSubject = new BehaviorSubject<SerialItem[]>([]);

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

export class ItemDataSource extends DataSource<Item> {
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

export class DeliveredSerialsDataSource extends DataSource<DeliveredSerial> {
  itemSubject = new BehaviorSubject<DeliveredSerial[]>([]);
  loadingSubject = new BehaviorSubject<boolean>(false);

  data: DeliveredSerial[];
  length: number;
  offset: number;

  loading$ = this.loadingSubject.asObservable();

  constructor(private readonly salesService: SalesService) {
    super();
  }

  connect() {
    return this.itemSubject.asObservable();
  }

  disconnect() {
    this.itemSubject.complete();
    this.loadingSubject.complete();
  }

  loadItems(uuid: string, search?, pageIndex = 0, pageSize = 30) {
    this.loadingSubject.next(true);
    this.salesService
      .getDeliveredSerials(uuid, search, pageIndex, pageSize)
      .pipe(
        map((res: APIResponse) => {
          this.data = res.docs;
          this.offset = res.offset;
          this.length = res.length;
          return res.docs;
        }),
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe({
        next: success => {
          this.itemSubject.next(success);
        },
        error: err => {
          this.itemSubject.next([]);
        },
      });
  }

  update(data) {
    this.itemSubject.next(data);
  }
}

export class DeliveredSerial {
  serial_no?: string;
  item_code?: string;
  purchase_date?: string;
  purchase_rate?: number;
  supplier?: string;
  company?: string;
  purchase_document_no?: string;
  warehouse?: string;
}

export interface DeliveryNoteItemInterface {
  item_code?: string;
  item_name?: string;
  qty?: number;
  rate?: number;
  has_serial_no?: number;
  against_sales_invoice?: string;
  warranty_date?: string;
  amount?: number;
  serial_no: any;
}
