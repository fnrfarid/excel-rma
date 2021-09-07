import { Component, OnInit } from '@angular/core';
import { CLOSE } from '../../../constants/app-string';
import {
  WarrantyItem,
  WarrantyClaimsDetails,
} from '../../../common/interfaces/warranty.interface';
import { WarrantyService } from '../../warranty-tabs/warranty.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ERROR_FETCHING_WARRANTY_CLAIM } from '../../../constants/messages';
import { DEFAULT_COMPANY } from '../../../constants/storage';
import { LoadingController } from '@ionic/angular';
import { PERMISSION_STATE } from '../../../constants/permission-roles';
import { PrintSettingDialog } from '../../shared-warranty-modules/print-setting-dialog/print-setting-dialog';
import { MatDialog } from '@angular/material/dialog';
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
  permissionState = PERMISSION_STATE;
  dataSource: WarrantyItem[];
  invoiceUuid: string;
  viewWArrantyClaimUrl: string;
  company: string;
  constructor(
    private readonly warrantyService: WarrantyService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingController: LoadingController,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.warrantyService
      .getStorage()
      .getItem(DEFAULT_COMPANY)
      .then(company => {
        this.company = company;
      });
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
          { duration: 4500 },
        );
      },
    });
  }

  async getPrint(format) {
    const loading = await this.loadingController.create({
      message: `Generating Print...!`,
    });
    await loading.present();
    this.warrantyService.generateWarrantyPrintBody(this.invoiceUuid).subscribe({
      next: success => {
        this.warrantyService.openPdf(format, this.invoiceUuid);
        loading.dismiss();
      },
      error: err => {
        loading.dismiss();
        this.snackBar.open(`Failed To Print`, CLOSE, { duration: 4500 });
      },
    });
  }

  async resetEntry() {
    const loading = await this.loadingController.create({
      message: `Cancelling Claim Please Wait...!`,
    });
    await loading.present();

    this.warrantyService
      .resetClaim(
        this.warrantyClaimsDetails?.uuid,
        this.warrantyClaimsDetails?.serial_no,
      )
      .subscribe({
        next: success => {
          loading.dismiss();
          this.router.navigate(['warranty']);
        },
        error: err => {
          loading.dismiss();
          this.snackBar.open(
            err.error.message ? err.error.message : `Failed to Cancel Claim`,
            CLOSE,
            {
              duration: 4500,
            },
          );
        },
      });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(PrintSettingDialog, {
      width: '300px',
      data: {},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getPrint(result);
      }
    });
  }
}
