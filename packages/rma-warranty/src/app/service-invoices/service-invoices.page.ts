import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AUTH_SERVER_URL } from '../constants/storage';
import { AddServiceInvoiceService } from '../warranty-ui/shared-warranty-modules/service-invoices/add-service-invoice/add-service-invoice.service';
import { ServiceInvoicesDataSource } from './service-invoices-datasource';

@Component({
  selector: 'app-service-invoice',
  templateUrl: './service-invoices.page.html',
  styleUrls: ['./service-invoices.page.scss'],
})
export class ServiceInvoicesPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input()
  invoiceUuid: string;
  dataSource: ServiceInvoicesDataSource;
  total: number = 0;
  displayedColumns = [
    'invoice_no',
    'status',
    'date',
    'customer_third_party',
    'invoice_amount',
    'claim_no',
    'remarks',
    'branch',
    'created_by',
    'submitted_by',
    'submit',
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly serviceInvoice: AddServiceInvoiceService,
    private readonly router: Router,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(val => {
        this.dataSource.loadItems(this.route.snapshot.params.uuid);
        this.getTotal();
      });
  }

  ngOnInit() {
    this.invoiceUuid = this.route.snapshot.params.uuid;
    this.dataSource = new ServiceInvoicesDataSource(this.serviceInvoice);
    this.dataSource.loadItems(this.invoiceUuid);
  }
  getUpdate(event) {
    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }
    this.dataSource.loadItems(
      this.invoiceUuid,
      sortQuery,
      event.pageIndex,
      event.pageSize,
    );
  }

  getTotal() {
    this.dataSource.total.subscribe({
      next: total => {
        this.total = total;
      },
    });
  }

  openERPServiceInvoice(row) {
    this.serviceInvoice
      .getStore()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        window.open(
          `${auth_url}/desk#Form/Sales%20Invoice/${row.invoice_no}`,
          '_blank',
        );
      });
  }
}
