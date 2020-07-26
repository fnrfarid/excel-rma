import { Component, OnInit, Input } from '@angular/core';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';
import { StockEntryService } from '../../view-warranty-claims/stock-entry/services/stock-entry/stock-entry.service';
import { StockEntryListDataSource } from './stock-entry-datasource';

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
  displayedColumns = [
    'stock_voucher_number',
    'claim_no',
    'type',
    'date',
    'description',
    'completed_by',
  ];
  constructor(private readonly stockEntryService: StockEntryService) {}

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
}
