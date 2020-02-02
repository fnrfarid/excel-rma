import { Component, OnInit } from '@angular/core';
import { PurchaseService } from '../../services/purchase.service';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { PurchaseInvoiceDetails } from '../../../common/interfaces/purchase.interface';
import { Item } from '../../../common/interfaces/sales.interface';
import { AUTH_SERVER_URL } from '../../../constants/storage';
import { CLOSE } from '../../../constants/app-string';
import { ERROR_FETCHING_PURCHASE_INVOICE } from '../../../constants/messages';
@Component({
  selector: 'purchase-details',
  templateUrl: './purchase-details.component.html',
  styleUrls: ['./purchase-details.component.scss'],
})
export class PurchaseDetailsComponent implements OnInit {
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];
  purchaseInvoiceDetails: PurchaseInvoiceDetails;
  dataSource: Item[];
  invoiceUuid: string;
  viewPurchaseInvoiceUrl: string;
  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
    this.purchaseInvoiceDetails = {} as PurchaseInvoiceDetails;
    this.getPurchaseInvoice(this.invoiceUuid);
  }

  getPurchaseInvoice(uuid: string) {
    this.purchaseService.getPurchaseInvoice(uuid).subscribe({
      next: (res: any) => {
        this.purchaseInvoiceDetails = res;
        this.purchaseInvoiceDetails.address_display = this
          .purchaseInvoiceDetails.address_display
          ? this.purchaseInvoiceDetails.address_display.replace(/\s/g, '')
          : undefined;
        this.purchaseInvoiceDetails.address_display = this
          .purchaseInvoiceDetails.address_display
          ? this.purchaseInvoiceDetails.address_display.replace(/<br>/g, '\n')
          : undefined;
        this.dataSource = res.items;
        this.purchaseService
          .getStore()
          .getItem(AUTH_SERVER_URL)
          .then(auth_url => {
            if (auth_url) {
              this.viewPurchaseInvoiceUrl = `${auth_url}/desk#Form/Purchase Invoice/${res.name}`;
            } else {
              this.purchaseService.getApiInfo().subscribe({
                next: response => {
                  this.viewPurchaseInvoiceUrl = `${response.authServerURL}/desk#Form/Purchase Invoice/${res.name}`;
                },
              });
            }
          });
      },
      error: err => {
        this.snackBar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_PURCHASE_INVOICE}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }
}
