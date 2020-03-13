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
  showReturnTab: boolean;
  isCampaign: boolean;

  constructor(
    private readonly location: Location,
    private route: ActivatedRoute,
    private salesService: SalesService,
  ) {}

  ngOnInit() {
    this.selectedSegment = 0;
    this.showReturnTab = false;
    this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
    this.salesService.getSalesInvoice(this.invoiceUuid).subscribe({
      next: (res: SalesInvoiceDetails) => {
        this.isCampaign = res.isCampaign;
        this.showReturnTab =
          Object.keys(res.delivered_items_map).length === 0 ? false : true;
        this.sales_invoice_name = res.name;
      },
    });
  }

  navigateBack() {
    this.location.back();
  }
}
