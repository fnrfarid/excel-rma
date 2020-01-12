import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { MatSnackBar } from '@angular/material';
import { CLOSE } from '../../../constants/aap-string';
import { ERROR_FETCHING_SALES_INVOICE } from '../../../constants/messages';

@Component({
  selector: 'sales-invoice-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];
  salesInvoiceDetails: SalesInvoiceDetails;
  dataSource: SalesInvoiceItem[];
  uuid;

  constructor(
    private readonly router: Router,
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(route => route instanceof NavigationEnd))
      .subscribe((route: NavigationEnd) => {
        this.uuid = route.url.split('/')[2];
        if (route.url.split('/')[1] === 'view-sales-invoice') {
          route.url.split('/').length >= 3
            ? this.getSalesInvoice(route.url.split('/')[2])
            : null;
        }
      });
  }

  getSalesInvoice(uuid: string) {
    this.salesService.getSalesInvoice(uuid).subscribe({
      next: (success: any) => {
        this.salesInvoiceDetails = success;
        this.salesInvoiceDetails.address_display = this.salesInvoiceDetails
          .address_display
          ? this.salesInvoiceDetails.address_display.replace(/<br>/g, '\n')
          : undefined;
        this.dataSource = success.items;
      },
      error: err => {
        this.snackBar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_SALES_INVOICE}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }
}

export class SalesInvoiceDetails {
  customer: string;
  company: string;
  posting_date: string;
  due_date: string;
  address_display: string;
  contact_display: string;
  submitted?: string;
  email?: string;
  posting_time?: string;
  set_posting_time?: number;
  contact_person?: string;
  territory?: string;
  update_stock?: number;
  total_qty?: number;
  base_total?: number;
  base_net_total?: number;
  total?: number;
  net_total?: number;
  pos_total_qty?: number;
}

export class SalesInvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}
