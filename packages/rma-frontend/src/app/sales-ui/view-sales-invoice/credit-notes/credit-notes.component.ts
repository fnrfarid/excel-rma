import { Component, OnInit, ViewChild } from '@angular/core';
import { CreditNotesDataSource } from './credit-notes-datasource';
import { MatPaginator, MatSort } from '@angular/material';
import { WarrantyService } from '../../..//warranty-ui/warranty-tabs/warranty.service';

@Component({
  selector: 'sales-invoice-credit-notes',
  templateUrl: './credit-notes.component.html',
  styleUrls: ['./credit-notes.component.scss'],
})
export class CreditNotesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns = [
    'name',
    'posting_date',
    'total',
    'customer_name',
    'owner',
    'modified_by',
    'company',
    'due_date',
    'return_against',
    'contact_email',
  ];
  model: string;
  search: string = '';

  dataSource: CreditNotesDataSource;

  constructor(private readonly warrantyService: WarrantyService) {}

  ngOnInit() {
    this.model = 'credit_note';
    this.dataSource = new CreditNotesDataSource(
      this.model,
      this.warrantyService,
    );
    this.dataSource.loadItems();
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }

  setFilter() {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }
}
