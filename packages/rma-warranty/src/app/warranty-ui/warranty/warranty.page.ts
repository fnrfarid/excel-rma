import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { WarrantyClaimsDataSource } from './warranty-claims-datasource';
import { Location } from '@angular/common';
import { WarrantyService } from '../warranty-tabs/warranty.service';
import { WarrantyClaims } from '../../common/interfaces/warranty.interface';
import { FormControl } from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../constants/date-format';
import { Router, NavigationEnd } from '@angular/router';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-warranty',
  templateUrl: './warranty.page.html',
  styleUrls: ['./warranty.page.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class WarrantyPage implements OnInit {
  warrantyClaimsList: Array<WarrantyClaims>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: WarrantyClaimsDataSource;
  displayedColumns = [
    'sr_no',
    'claim_no',
    'claim_type',
    'received_date',
    'customer_third_party',
    'customer_name',
    'third_party_name',
    'item_code',
    'claimed_serial',
    'claim_status',
    'receiving_branch',
    'delivery_branch',
    'received_by',
    'delivered_by',
  ];
  claimList;
  customerList;
  territoryList;
  customer: any;
  claim_no: string;
  customer_third_party: string;
  product: string;
  claim_status: string = 'All';
  claim_type: string;
  territory: string;
  claimed_serial: string;
  fromDateFormControl = new FormControl();
  toDateFormControl = new FormControl();
  singleDateFormControl = new FormControl();
  claimStatusList: string[] = [
    'In Progress',
    'To Deliver',
    'Delivered',
    'Rejected',
    'All',
  ];

  constructor(
    private location: Location,
    private readonly warrantyService: WarrantyService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.claimList = [
      'Warranty',
      'Non Warranty',
      'Non Serial Warranty',
      'Third Party Warranty',
    ];
    this.dataSource = new WarrantyClaimsDataSource(this.warrantyService);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map((event: any) => {
          if (event.url === '/warranty') this.getTerritory();
          return event;
        }),
      )
      .subscribe({
        next: res => {},
        error: err => {},
      });
    this.getCustomerList();
  }

  getTerritory() {
    this.warrantyService
      .getStorage()
      .getItem('territory')
      .then(territory => {
        this.territoryList = territory;
        this.dataSource.loadItems(
          undefined,
          undefined,
          undefined,
          {},
          { territory },
        );
      });
  }

  getUpdate(event) {
    const query: any = this.getFilterQuery();
    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }
    this.dataSource.loadItems(
      sortQuery,
      event.pageIndex,
      event.pageSize,
      query,
      { territory: this.territoryList },
    );
  }

  setFilter(event?) {
    const query: any = this.getFilterQuery();

    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    this.dataSource.loadItems(
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      query,
      { territory: this.territoryList },
    );
  }

  getFilterQuery() {
    const query: any = {};
    if (this.customer) query.customer = this.customer.name;
    if (this.claim_no) query.claim_no = this.claim_no;
    if (this.customer_third_party)
      query.customer_third_party = this.customer_third_party;
    if (this.product) query.product = this.product;
    if (this.claim_status) query.claim_status = this.claim_status;
    if (this.claim_type) query.claim_type = this.claim_type;
    if (this.territory) query.territory = this.territory;
    if (this.claimed_serial) query.claimed_serial = this.claimed_serial;

    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      query.fromDate = new Date(this.fromDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.toDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }

    if (this.singleDateFormControl.value) {
      query.fromDate = new Date(this.singleDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.singleDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }
    return query;
  }

  statusChange(status) {
    if (status === 'All') {
      this.dataSource.loadItems(undefined, undefined, undefined, undefined, {
        territory: this.territoryList,
      });
    } else {
      this.claim_status = status;
      this.setFilter();
    }
  }

  dateFilter() {
    this.singleDateFormControl.setValue('');
    this.setFilter();
  }

  singleDateFilter() {
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.setFilter();
  }

  clearFilters() {
    this.customer = '';
    this.claim_no = '';
    this.customer_third_party = '';
    this.product = '';
    this.claim_status = 'All';
    this.claim_type = '';
    this.territory = '';
    this.claimed_serial = '';
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.singleDateFormControl.setValue('');
    this.dataSource.loadItems(undefined, undefined, undefined, undefined, {
      territory: this.territoryList,
    });
  }

  navigateBack() {
    this.location.back();
  }

  getCustomerList() {
    this.warrantyService.getAddressList().subscribe({
      next: response => {
        this.customerList = response;
      },
      error: error => {},
    });
  }

  getCustomerOption(option) {
    if (option) return option.name;
  }

  getOption() {}
}
