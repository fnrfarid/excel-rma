import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-sales-invoice',
  templateUrl: './view-sales-invoice.page.html',
  styleUrls: ['./view-sales-invoice.page.scss'],
})
export class ViewSalesInvoicePage implements OnInit {
  selectedSegment: string;

  constructor() {}

  ngOnInit() {
    this.selectedSegment = 'details';
  }
}
