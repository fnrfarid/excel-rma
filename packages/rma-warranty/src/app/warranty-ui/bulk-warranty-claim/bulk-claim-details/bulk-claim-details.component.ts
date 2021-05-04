import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { WarrantyService } from '../../warranty-tabs/warranty.service';
import { WarrantyClaimsDataSource } from '../../warranty/warranty-claims-datasource';
import { DURATION } from 'src/app/constants/app-string';

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

  comingSoon(message) {
    this.snackBar.open(message, 'Close', { duration: DURATION });
  }
}
