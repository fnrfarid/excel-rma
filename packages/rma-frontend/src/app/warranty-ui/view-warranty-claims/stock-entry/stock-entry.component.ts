import { Component, OnInit, Input } from '@angular/core';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';

@Component({
  selector: 'stock-entry',
  templateUrl: './stock-entry.component.html',
  styleUrls: ['./stock-entry.component.scss'],
})
export class StockEntryComponent implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  uuid: string = '';
  displayedColumns = [
    'stock_voucher_number',
    'claim_no',
    'type',
    'date',
    'description',
    'completed_by',
  ];
  constructor() {}

  ngOnInit() {
    this.uuid = this.warrantyObject?.uuid;
  }
}
