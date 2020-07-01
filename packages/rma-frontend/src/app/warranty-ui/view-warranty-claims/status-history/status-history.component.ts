import { Component, OnInit, Input } from '@angular/core';
import { WarrantyClaimsDetails } from '../../../common/interfaces/warranty.interface';

@Component({
  selector: 'status-history',
  templateUrl: './status-history.component.html',
  styleUrls: ['./status-history.component.scss'],
})
export class StatusHistoryComponent implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;

  displayedColumns = [
    'posting_date',
    'time',
    'status_from',
    'transfer_branch',
    'verdict',
    'description',
    'delivery_status',
    'status',
    'rollback',
  ];
  constructor() {}

  ngOnInit() {}
}
