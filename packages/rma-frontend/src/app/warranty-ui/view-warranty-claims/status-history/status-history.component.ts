import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'status-history',
  templateUrl: './status-history.component.html',
  styleUrls: ['./status-history.component.scss'],
})
export class StatusHistoryComponent implements OnInit {
  displayedColumns = [
    'date',
    'posting_time',
    'status_from',
    'transfer_branch',
    'current_status_verdict',
    'description',
    'repaired',
    'status_by',
    'rollback',
  ];
  constructor() {}

  ngOnInit() {}
}
