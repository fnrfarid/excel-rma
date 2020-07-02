import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { CustomerDataSource } from './customer-datasource';
import { SalesService } from '../sales-ui/services/sales.service';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin, from, throwError, of } from 'rxjs';
import { ItemPriceService } from '../sales-ui/services/item-price.service';
import { TimeService } from '../api/time/time.service';
import { map, switchMap, retry } from 'rxjs/operators';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  DEFAULT_COMPANY,
} from '../constants/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE } from '../constants/app-string';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.page.html',
  styleUrls: ['./customer-profile.page.scss'],
})
export class CustomerProfilePage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  dataSource: CustomerDataSource;
  defaultCompany: string;
  displayedColumns = [
    'customer',
    'territory',
    'credit_limit',
    'remaining_balance',
    'remaining_credit',
  ];
  search: string = '';
  filters: any = [];
  countFilter: any = {};
  constructor(
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly itemService: ItemPriceService,
    private readonly time: TimeService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.setDefaultCompany();
    this.dataSource = new CustomerDataSource(this.salesService);
    this.dataSource.loadItems(0, 10, this.filters, this.countFilter);
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      event.pageIndex,
      event.pageSize,
      this.filters,
      this.countFilter,
    );
  }

  setFilter() {
    this.filters = [];
    this.countFilter = {};

    if (this.search) {
      this.filters.push(['name', 'like', `%${this.search}%`]);
      this.countFilter.name = ['like', `%${this.search}%`];
    }

    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
      this.countFilter,
    );
  }

  loadPrice(row, index) {
    const data = this.dataSource.getData();
    this.dataSource.loadingSubject.next(true);
    if (data && data.length) {
      data[index] = { ...row };
      of({})
        .pipe(
          switchMap(obj => {
            return forkJoin({
              time: from(this.time.getDateTime(new Date())),
              token: from(this.salesService.getStore().getItem(ACCESS_TOKEN)),
              debtorAccount: this.salesService
                .getApiInfo()
                .pipe(map(res => res.debtorAccount)),
              customer: this.salesService.relayCustomer(data[index].name),
            });
          }),
          switchMap(({ token, time, debtorAccount, customer }) => {
            if (!debtorAccount) {
              return throwError({
                message: 'Please select Debtor Account in settings',
              });
            }

            if (customer) {
              customer.credit_limits.forEach(limit => {
                if (limit.company === this.defaultCompany) {
                  data[index].credit_limit = limit.credit_limit;
                }
              });
            }
            const headers = {
              [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
            };
            return this.itemService.getRemainingBalance(
              debtorAccount,
              time,
              'Customer',
              data[index].customer_name,
              this.defaultCompany,
              headers,
            );
          }),
          retry(3),
        )
        .subscribe({
          next: balance => {
            this.dataSource.loadingSubject.next(false);
            data[index].remaining_balance = balance || '0.00';
          },
          error: err => {
            this.dataSource.loadingSubject.next(false);
            this.snackBar.open(
              'Error Occurred in fetching customer balance',
              CLOSE,
              { duration: 3500 },
            );
          },
        });
    } else {
      this.dataSource.loadingSubject.next(false);
    }
    this.dataSource.update(data);
  }

  getRemainingCredit(row) {
    if (row && row.credit_limit && row.remaining_balance) {
      return row.credit_limit - row.remaining_balance;
    }
    return;
  }

  setDefaultCompany() {
    this.salesService
      .getStore()
      .getItems([DEFAULT_COMPANY])
      .then(items => {
        if (items[DEFAULT_COMPANY]) {
          this.defaultCompany = items[DEFAULT_COMPANY];
        } else {
          this.salesService.getApiInfo().subscribe({
            next: res => {
              this.defaultCompany = res.defaultCompany;
            },
            error: error => {
              this.snackBar.open('Error fetching default company', CLOSE, {
                duration: 3500,
              });
            },
          });
        }
      });
  }

  navigateBack() {
    this.location.back();
  }
}
