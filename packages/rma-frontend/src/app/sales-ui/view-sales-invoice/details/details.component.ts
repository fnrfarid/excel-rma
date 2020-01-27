import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../services/sales.service';
import { MatSnackBar } from '@angular/material';
import { CLOSE, REJECTED } from '../../../constants/app-string';
import { ERROR_FETCHING_SALES_INVOICE } from '../../../constants/messages';
import { Location } from '@angular/common';
import { Item } from '../../../common/interfaces/sales.interface';
import { AUTH_SERVER_URL } from 'src/app/constants/storage';

@Component({
  selector: 'sales-invoice-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];
  salesInvoiceDetails: SalesInvoiceDetails;
  dataSource: SalesInvoiceItem[];
  invoiceUuid: string;
  viewSalesInvoiceUrl: string;

  constructor(
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit() {
    this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
    this.getSalesInvoice(this.invoiceUuid);
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
        this.salesService
          .getStore()
          .getItem(AUTH_SERVER_URL)
          .then(auth_url => {
            this.viewSalesInvoiceUrl = `${auth_url}/desk#Form/Sales Invoice/${success.name}`;
          });
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

  submitSalesInvoice() {
    this.salesService
      .submitSalesInvoice(this.route.snapshot.params.invoiceUuid)
      .subscribe({
        next: success => {
          this.location.back();
        },
      });
  }

  rejectSalesInvoice() {
    const payload = {} as SalesInvoiceDetails;
    payload.uuid = this.route.snapshot.params.invoiceUuid;
    payload.status = REJECTED;
    this.salesService.updateSalesInvoice(payload).subscribe({
      next: success => {
        this.location.back();
      },
    });
  }
}

export class SalesInvoiceDetails {
  uuid?: string;
  customer: string;
  company: string;
  posting_date: string;
  customer_email: string;
  due_date: string;
  address_display: string;
  contact_display: string;
  status: string;
  submitted?: string;
  email?: string;
  contact_email: string;
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
  items?: Item[];
  pos_total_qty?: number;
  name?: string;
}

export class SalesInvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}
