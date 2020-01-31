import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'purchase-details',
  templateUrl: './purchase-details.component.html',
  styleUrls: ['./purchase-details.component.scss'],
})
export class PurchaseDetailsComponent implements OnInit {
  dataSource = [];
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];

  constructor() {}

  ngOnInit() {}
}
