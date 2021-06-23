import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { WarrantyService } from '../../warranty-tabs/warranty.service';
import { WarrantyClaimsDataSource } from '../../warranty/warranty-claims-datasource';
import { CLAIM_STATUS, CLOSE } from '../../../constants/app-string';
import { LoadingController } from '@ionic/angular';
import { MatDialog } from '@angular/material/dialog';
import { PrintSettingDialog } from '../../shared-warranty-modules/print-setting-dialog/print-setting-dialog';

@Component({
  selector: 'bulk-claim-details',
  templateUrl: './bulk-claim-details.component.html',
  styleUrls: ['./bulk-claim-details.component.scss'],
})
export class BulkClaimDetailsComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: WarrantyClaimsDataSource;
  claim_no: string = this.route.snapshot.params.name;
  selectedSegment: any;
  uuid: string = this.route.snapshot.params.uuid;
  displayedColumns = [
    'sr_no',
    'claim_no',
    'claim_type',
    'received_date',
    'customer_name',
    'third_party_name',
    'item_code',
    'claimed_serial',
    'claim_status',
    'receiving_branch',
    'delivery_branch',
    'received_by',
    'delivered_by',
    'product_brand',
    'replace_serial',
    'problem',
    'verdict',
    'delivery_date',
    'billed_amount',
    'remarks',
  ];
  constructor(
    private readonly router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private warrantyService: WarrantyService,
    private readonly loadingController: LoadingController,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.selectedSegment = 0;
    this.dataSource = new WarrantyClaimsDataSource(this.warrantyService);
    this.dataSource.loadItems(
      undefined,
      undefined,
      undefined,
      { parent: this.route.snapshot.params?.uuid },
      {
        set: ['Part'],
      },
    );
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map((event: any) => {
          if (
            (event.url === '/bulk-warranty-claim',
            this.route.snapshot.params.name,
            this.route.snapshot.params.uuid)
          ) {
            this.dataSource.loadItems(
              undefined,
              undefined,
              undefined,
              { parent: this.route.snapshot.params?.uuid },
              {
                set: ['Part'],
              },
            );
          }
          return event;
        }),
      )
      .subscribe({
        next: res => {},
        error: err => {},
      });
  }

  getUpdate(event) {
    const query: any = {};
    this.paginator.pageIndex = event?.pageIndex || 0;
    this.paginator.pageSize = event?.pageSize || 30;

    this.dataSource.loadItems(
      {},
      this.paginator.pageIndex,
      this.paginator.pageSize,
      { parent: this.route.snapshot.params?.uuid, ...query },
      {
        set: ['Part'],
      },
    );
  }

  printDeliveryNote(docType?: string, format?: string) {
    let print_type: string = '';
    return this.warrantyService.getWarrantyClaim(this.uuid).pipe(
      switchMap((data: any) => {
        switch (data.claim_status) {
          case CLAIM_STATUS.DELIVERED:
            print_type = `Delivery Token`;
            break;

          default:
            print_type = `Service Token`;
            break;
        }
        const aggregatedWarrantyReciept = data;
        const warehouses: {
          [ket: string]: string;
        } = {};
        return this.warrantyService.printDocument({
          ...aggregatedWarrantyReciept,
          name: data.claim_no,
          print: {
            print_type,
            ...warehouses,
          },
        });
      }),
    );
  }

  async getPrint(format) {
    const loading = await this.loadingController.create({
      message: `Generating Print...!`,
    });
    await loading.present();
    const doc = `Warranty Claim`;
    this.printDeliveryNote(doc, format).subscribe({
      next: success => {
        this.warrantyService.openPdf(format, this.uuid);
        loading.dismiss();
      },
      error: err => {
        loading.dismiss();
        this.snackBar.open(`Failed To Print`, CLOSE, { duration: 4500 });
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
