import { Component, OnInit, Input } from '@angular/core';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';
import { StockEntryService } from '../../view-warranty-claims/stock-entry/services/stock-entry/stock-entry.service';
import { StockEntryListDataSource } from './stock-entry-datasource';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DURATION } from '../../../constants/app-string';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'stock-entry',
  templateUrl: './stock-entry.component.html',
  styleUrls: ['./stock-entry.component.scss'],
})
export class StockEntryComponent implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  warrantyClaimUuid: string = '';
  dataSource: StockEntryListDataSource;
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
  ) {}

  ngOnInit() {
    this.warrantyClaimUuid = this.warrantyObject?.uuid;
    this.dataSource = new StockEntryListDataSource(this.stockEntryService);
    this.dataSource.loadItems('asc', 0, 10, {
      warrantyClaimUuid: this.warrantyClaimUuid,
    });
  }

  getUpdate(event) {
    this.dataSource.loadItems('asc', event.pageIndex, event.pageSize, {
      warrantyClaimUuid: this.warrantyClaimUuid,
    });
  }

  async removeStockEntry(row) {
    const loading = await this.loadingController.create();
    await loading.present();
    this.stockEntryService
      .removeStockEntry(row.stock_voucher_number)
      .subscribe({
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
          this.snackbar.open('Failed to Cancel Stock Entry', 'Close', {
            duration: DURATION,
          });
          this.dataSource.loadItems('asc', 0, 10, {
            warrantyClaimUuid: this.warrantyClaimUuid,
          });
        },
      });
  }
}
