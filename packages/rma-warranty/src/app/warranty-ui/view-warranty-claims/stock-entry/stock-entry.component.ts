import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';
import { StockEntryService } from '../../view-warranty-claims/stock-entry/services/stock-entry/stock-entry.service';
import { StockEntryListDataSource } from './stock-entry-datasource';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DURATION } from '../../../constants/app-string';
import { LoadingController } from '@ionic/angular';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PERMISSION_STATE } from '../../../constants/permission-roles';
import { AddServiceInvoiceService } from '../../shared-warranty-modules/service-invoices/add-service-invoice/add-service-invoice.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'stock-entry',
  templateUrl: './stock-entry.component.html',
  styleUrls: ['./stock-entry.component.scss'],
})
export class StockEntryComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  warrantyClaimUuid: string = '';
  dataSource: StockEntryListDataSource;
  permissionState = PERMISSION_STATE;
  active: boolean;
  displayedColumns = [
    'stock_voucher_number',
    'claim_no',
    'type',
    'date',
    'description',
    'completed_by',
    'rollback',
  ];
  constructor(
    private readonly stockEntryService: StockEntryService,
    private readonly snackbar: MatSnackBar,
    private readonly loadingController: LoadingController,
    private readonly route: ActivatedRoute,
    private readonly addserviceInvoiceService: AddServiceInvoiceService,
    private readonly router: Router,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(val => {
        this.dataSource.loadItems(undefined, undefined, undefined, {
          warrantyClaimUuid: this.route.snapshot.params.uuid,
        });
      });
  }

  ngOnInit() {
    this.addserviceInvoiceService
      .getWarrantyDetail(this.warrantyObject?.uuid)
      .subscribe({
        next: res => {
          this.warrantyObject = res;
        },
      });
    this.warrantyClaimUuid = this.warrantyObject?.uuid;
    this.dataSource = new StockEntryListDataSource(this.stockEntryService);
    this.dataSource.loadItems(undefined, undefined, undefined, {
      warrantyClaimUuid: this.warrantyClaimUuid,
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
    this.dataSource.loadItems(sortQuery, event.pageIndex, event.pageSize, {
      warrantyClaimUuid: this.warrantyClaimUuid,
    });
  }

  async removeStockEntry(row) {
    const loading = await this.loadingController.create({
      message: 'Reverting Stock Entry...!',
    });
    await loading.present();
    this.stockEntryService.removeStockEntry(row).subscribe({
      next: res => {
        loading.dismiss();
        this.snackbar.open('Stock Entry Cacelled succesfully', 'Close', {
          duration: DURATION,
        });
        this.dataSource.loadItems('asc', 0, 10, {
          warrantyClaimUuid: this.warrantyClaimUuid,
        });
      },
      error: err => {
        loading.dismiss();
        if (err && err.error && err.error.message) {
          this.snackbar.open(err.error.message, 'Close', {
            duration: DURATION,
          });
        }
        this.snackbar.open('Failed to Cancel Stock Entry', 'Close', {
          duration: DURATION,
        });
        this.dataSource.loadItems('asc', 0, 10, {
          warrantyClaimUuid: this.warrantyClaimUuid,
        });
      },
    });
  }

  async finalizeEntry() {
    const loading = await this.loadingController.create({
      message: 'Reverting Stock Entry...!',
    });
    await loading.present();
    this.stockEntryService.finalizeEntry(this.warrantyClaimUuid).subscribe({
      next: res => {
        loading.dismiss();
        this.dataSource.loadItems(undefined, undefined, undefined, {
          warrantyClaimUuid: this.warrantyClaimUuid,
        });
        this.snackbar.open('Stock Entries Finalized', 'Close', {
          duration: DURATION,
        });
      },
      error: err => {
        loading.dismiss();
        if (err && err.error && err.error.message) {
          this.dataSource.loadItems(undefined, undefined, undefined, {
            warrantyClaimUuid: this.warrantyClaimUuid,
          });
          this.snackbar.open(err.error.message, 'Close', {
            duration: DURATION,
          });
          return;
        }
        this.dataSource.loadItems(undefined, undefined, undefined, {
          warrantyClaimUuid: this.warrantyClaimUuid,
        });
        this.snackbar.open('Failed to Finalize Stock Entry', 'Close', {
          duration: DURATION,
        });
      },
    });
  }
}
