import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDataSource } from './service-invoice-datasource';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DURATION,
  SERVICE_INVOICE_STATUS,
} from '../../../constants/app-string';
import { LoadingController } from '@ionic/angular';
import { AUTH_SERVER_URL } from '../../../constants/storage';

@Component({
  selector: 'service-invoices',
  templateUrl: './service-invoices.component.html',
  styleUrls: ['./service-invoices.component.scss'],
})
export class ServiceInvoicesComponent implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  invoiceUuid: string;
  dataSource: ServiceInvoiceDataSource;
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
    private readonly router: ActivatedRoute,
    private readonly serviceInvoice: AddServiceInvoiceService,
    private readonly snackbar: MatSnackBar,
    private readonly loadingController: LoadingController,
  ) {}

  ngOnInit() {
    this.invoiceUuid = this.router.snapshot.params.uuid;
    this.dataSource = new ServiceInvoiceDataSource(this.serviceInvoice);
    this.dataSource.loadItems(this.invoiceUuid);
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      this.invoiceUuid,
      'asc',
      event.pageIndex,
      event.pageSize,
    );
  }

  async submitInvoice(row) {
    const loading = await this.loadingController.create();
    await loading.present();
    row.docstatus = 1;
    row.is_pos = 1;
    this.serviceInvoice
      .getStore()
      .getItem('pos_profile')
      .then(profile => {
        row.pos_profile = profile;
      });
    row.payments = [];
    row.status = SERVICE_INVOICE_STATUS.PAID;
    row.payments.push({
      account: row.pos_profile,
      mode_of_payment: 'Cash',
      amount: row.total,
    });
    this.serviceInvoice.submitInvoice(row).subscribe({
      next: () => {
        loading.dismiss();
        this.snackbar.open('Invoice Submitted Sucessfully', 'Close', {
          duration: DURATION,
        });
      },
      error: ({ message }) => {
        loading.dismiss();
        if (!message) message = 'Failed to Submit Service Invoice';
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
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