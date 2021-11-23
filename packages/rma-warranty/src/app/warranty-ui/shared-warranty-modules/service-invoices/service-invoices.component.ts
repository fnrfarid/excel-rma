import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDataSource } from './service-invoice-datasource';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';
import { AUTH_SERVER_URL } from '../../../constants/storage';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PERMISSION_STATE } from '../../../constants/permission-roles';
import { filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DURATION } from '../../../constants/app-string';

@Component({
  selector: 'service-invoices',
  templateUrl: './service-invoices.component.html',
  styleUrls: ['./service-invoices.component.scss'],
})
export class ServiceInvoicesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  invoiceUuid: string;
  dataSource: ServiceInvoiceDataSource;
  permissionState = PERMISSION_STATE;
  total: number = 0;
  disableRefresh: boolean = false;
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
    private readonly snackbar: MatSnackBar,
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
    this.dataSource = new ServiceInvoiceDataSource(this.serviceInvoice);
    this.dataSource.loadItems({ warrantyClaimUuid: this.invoiceUuid });
    this.dataSource.disableRefresh.subscribe({
      next: res => {
        this.disableRefresh = res;
      },
    });
  }

  syncDocStatus() {
    this.dataSource.syncDocStatus().subscribe({
      next: res => {},
    });
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
      { warrantyClaimUuid: this.invoiceUuid },
      sortQuery,
      event.pageIndex,
      event.pageSize,
    );
  }

  submitInvoice(inovoice_no: string) {
    this.serviceInvoice.submitServiceInvoice(inovoice_no).subscribe({
      next: nxt => {
        this.dataSource.loadItems({ warrantyClaimUuid: this.invoiceUuid });
        this.snackbar.open(`Service Invoice Submitted Succefully`, 'Close', {
          duration: DURATION,
        });
      },
      error: err => {
        this.snackbar.open(
          err.error.message
            ? err.error.message
            : `Failed to Submit Invoice Check on Erp to ensure its submitted`,
          'Close',
          { duration: DURATION },
        );
      },
    });
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
