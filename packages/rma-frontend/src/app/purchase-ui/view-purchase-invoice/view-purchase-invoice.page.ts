import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-purchase-invoice',
  templateUrl: './view-purchase-invoice.page.html',
  styleUrls: ['./view-purchase-invoice.page.scss'],
})
export class ViewPurchaseInvoicePage implements OnInit {
  selectedSegment: any;

  constructor(private readonly location: Location) {}

  ngOnInit() {
    this.selectedSegment = 0;
  }

  navigateBack() {
    this.location.back();
  }
}
