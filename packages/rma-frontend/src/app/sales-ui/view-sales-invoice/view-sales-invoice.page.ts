import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-sales-invoice',
  templateUrl: './view-sales-invoice.page.html',
  styleUrls: ['./view-sales-invoice.page.scss'],
})
export class ViewSalesInvoicePage implements OnInit {
  selectedSegment: any;

  constructor(private readonly location: Location) {}

  ngOnInit() {
    this.selectedSegment = 0;
  }

  navigateBack() {
    this.location.back();
  }
}
