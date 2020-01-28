import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../services/sales.service';
import { SalesInvoiceDetails } from './details/details.component';

@Component({
  selector: 'app-view-sales-invoice',
  templateUrl: './view-sales-invoice.page.html',
  styleUrls: ['./view-sales-invoice.page.scss'],
})
export class ViewSalesInvoicePage implements OnInit {
  selectedSegment: any;
  sales_invoice_name: string = '';
  invoiceUuid: string = '';
  constructor(
    private readonly location: Location,
    private route: ActivatedRoute,
    private salesService: SalesService,
  ) {}

  ngOnInit() {
    this.selectedSegment = 0;
    this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
    this.salesService.getSalesInvoice(this.invoiceUuid).subscribe({
      next: (res: SalesInvoiceDetails) => {
        this.sales_invoice_name = res.name;
      },
    });
  }

  navigateBack() {
    this.location.back();
  }
}
