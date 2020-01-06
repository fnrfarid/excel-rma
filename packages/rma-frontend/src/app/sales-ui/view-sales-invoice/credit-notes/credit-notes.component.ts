import { Component, OnInit } from '@angular/core';
import { CreditNotesDataSource } from './credit-notes-datasource';

@Component({
  selector: 'sales-invoice-credit-notes',
  templateUrl: './credit-notes.component.html',
  styleUrls: ['./credit-notes.component.scss'],
})
export class CreditNotesComponent implements OnInit {
  displayedColumns = [
    'voucherNo',
    'invoiceNo',
    'brand',
    'date',
    'amount',
    'remarks',
    'createdBy',
    'submittedBy',
  ];

  dataSource: CreditNotesDataSource;

  constructor() {}

  ngOnInit() {
    this.dataSource = new CreditNotesDataSource();
    this.dataSource.loadItems();
  }
}
