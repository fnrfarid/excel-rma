import { Component, OnInit } from '@angular/core';
import { CLOSE } from '../../../constants/app-string';
import {
  Item,
  WarrantyClaimsDetails,
} from '../../../common/interfaces/warranty.interface';
import { WarrantyService } from '../../warranty-tabs/warranty.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ERROR_FETCHING_WARRANTY_CLAIM } from '../../../constants/messages';
@Component({
  selector: 'claim-details',
  templateUrl: './claim-details.component.html',
  styleUrls: ['./claim-details.component.scss'],
})
export class ClaimDetailsComponent implements OnInit {
  displayedColumns = [
    'warranty_status',
    'replaced_product',
    'status_date',
    'replaced_serial',
    'status_given_by',
    'replaced_voucher_no',
    'claim_status',
    'damaged_voucher_no',
    'spareparts_consumption',
    'replacement_item_warehouse',
    'current_status',
    'damaged_item_warehouse',
    'service_invoice_no',
    'servicing_amount',
  ];
  warrantyClaimsDetails: WarrantyClaimsDetails;
  dataSource: Item[];
  invoiceUuid: string;
  viewWArrantyClaimUrl: string;
  constructor(
    private readonly warrantyService: WarrantyService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.invoiceUuid = this.route.snapshot.params.uuid;
    this.warrantyClaimsDetails = {} as WarrantyClaimsDetails;
    this.getWarrantyClaim(this.invoiceUuid);
  }
  getWarrantyClaim(uuid: string) {
    this.warrantyService.getWarrantyClaim(uuid).subscribe({
      next: (res: any) => {
        this.warrantyClaimsDetails = res;
        this.warrantyClaimsDetails.address_display = this.warrantyClaimsDetails
          .address_display
          ? this.warrantyClaimsDetails.address_display.replace(/\s/g, '')
          : undefined;
        this.warrantyClaimsDetails.address_display = this.warrantyClaimsDetails
          .address_display
          ? this.warrantyClaimsDetails.address_display.replace(/<br>/g, '\n')
          : undefined;
      },
      error: err => {
        this.snackBar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_WARRANTY_CLAIM}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }
}
