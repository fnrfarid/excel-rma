import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDataSource } from './service-invoice-datasource';
import { WarrantyClaimsDetails } from 'src/app/common/interfaces/warranty.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DURATION } from '../../../constants/app-string';
import { LoadingController } from '@ionic/angular';

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
    row.status = 'Paid';
    row.docstatus = 1;
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
}
