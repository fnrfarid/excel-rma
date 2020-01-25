import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-sales-invoice',
  templateUrl: './view-sales-invoice.page.html',
  styleUrls: ['./view-sales-invoice.page.scss'],
})
export class ViewSalesInvoicePage implements OnInit {
  selectedSegment: any;
  sales_invoice_name: string;
  constructor(private readonly location: Location, private router: Router) {}

  ngOnInit() {
    this.selectedSegment = 0;
    this.sales_invoice_name = this.router.getCurrentNavigation().extras.state.sales_invoice_name;
  }

  navigateBack() {
    this.location.back();
  }
}
