import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'stock-entry',
  templateUrl: './stock-entry.component.html',
  styleUrls: ['./stock-entry.component.scss'],
})
export class StockEntryComponent implements OnInit {
  displayedColumns = [
    'stock_voucher_number',
    'claim_no',
    'type',
    'date',
    'description',
    'completed_by',
  ];
  constructor() {}

  ngOnInit() {}
}
