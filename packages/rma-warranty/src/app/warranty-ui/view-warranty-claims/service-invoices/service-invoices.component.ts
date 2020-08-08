import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddServiceInvoiceService } from './add-service-invoice/add-service-invoice.service';
import { ServiceInvoiceDataSource } from './service-invoice-datasource';
import { WarrantyClaimsDetails } from 'src/app/common/interfaces/warranty.interface';

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
  ];
  constructor(
    private readonly router: ActivatedRoute,
    private readonly serviceInvoice: AddServiceInvoiceService,
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
}
