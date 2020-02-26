import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { Observable, throwError, of, from, forkJoin } from 'rxjs';
import { startWith, switchMap, filter, map, mergeMap } from 'rxjs/operators';
import { Location } from '@angular/common';

import { SalesInvoice, Item } from '../../common/interfaces/sales.interface';
import { ItemsDataSource } from './items-datasource';
import { SalesService } from '../services/sales.service';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';
import {
  DEFAULT_COMPANY,
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import {
  DRAFT,
  CLOSE,
  DURATION,
  UPDATE_ERROR,
  SHORT_DURATION,
} from '../../constants/app-string';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemPriceService } from '../services/item-price.service';
import { INSUFFICIENT_STOCK_BALANCE } from '../../constants/messages';
import { TimeService } from '../../api/time/time.service';

@Component({
  selector: 'app-add-sales-invoice',
  templateUrl: './add-sales-invoice.page.html',
  styleUrls: ['./add-sales-invoice.page.scss'],
})
export class AddSalesInvoicePage implements OnInit {
  salesInvoice: SalesInvoice;
  invoiceUuid: string;
  calledFrom: string;
  dataSource: ItemsDataSource;
  series: string;
  total: number = 0;
  postingDate: string;
  dueDate: string;
  address = {} as any;
  remarks = '';
  displayedColumns = ['item', 'stock', 'quantity', 'rate', 'total', 'delete'];
  warehouseFormControl = new FormControl('');
  filteredWarehouseList: Observable<any[]>;
  filteredCustomerList: Observable<any[]>;
  companyFormControl = new FormControl('', [Validators.required]);
  customerFormControl = new FormControl('', [Validators.required]);
  postingDateFormControl = new FormControl('', [Validators.required]);
  dueDateFormControl = new FormControl('', [Validators.required]);
  campaignInvoiceFormControl = new FormControl('');
  remainingBalanceFormControl = new FormControl('');

  constructor(
    private readonly route: ActivatedRoute,
    private salesService: SalesService,
    private itemPriceService: ItemPriceService,
    private readonly snackbar: MatSnackBar,
    private location: Location,
    private readonly router: Router,
    private readonly time: TimeService,
  ) {}

  ngOnInit() {
    this.dataSource = new ItemsDataSource();
    this.salesInvoice = {} as SalesInvoice;
    this.series = '';
    this.postingDateFormControl.setValue(new Date());
    this.calledFrom = this.route.snapshot.params.calledFrom;
    if (this.calledFrom === 'edit') {
      this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
      this.salesService.getSalesInvoice(this.invoiceUuid).subscribe({
        next: (res: SalesInvoiceDetails) => {
          this.companyFormControl.setValue(res.company);
          this.customerFormControl.setValue({
            customer_name: res.customer,
            owner: res.contact_email,
          });
          this.getRemainingBalance();
          this.postingDateFormControl.setValue(new Date(res.posting_date));
          this.dueDateFormControl.setValue(new Date(res.due_date));
          this.dataSource.loadItems(res.items);
          this.calculateTotal(res.items);
          this.campaignInvoiceFormControl.setValue(res.isCampaign);
        },
      });
    }
    this.filteredCustomerList = this.customerFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService
          .getCustomerList(value)
          .pipe(map(res => res.docs));
      }),
    );

    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getWarehouseList(value);
      }),
    );

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe({
        next: event => {
          this.salesService
            .getStore()
            .getItems([DEFAULT_COMPANY])
            .then(items => {
              if (items[DEFAULT_COMPANY]) {
                this.companyFormControl.setValue(items[DEFAULT_COMPANY]);
                this.getRemainingBalance();
              } else {
                this.getApiInfo().subscribe({
                  next: res => {
                    this.companyFormControl.setValue(res.defaultCompany);
                  },
                  error: error => {},
                });
              }
            });
        },
        error: error => {},
      });
  }

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.item_code = '';
    item.minimumPrice = 0;
    item.stock = this.warehouseFormControl.value ? 'Select an Item' : '';
    data.push(item);
    this.dataSource.update(data);
  }

  updateStockBalance(warehouse) {
    const data = this.dataSource.data();
    if (warehouse) {
      data.forEach((item, index) => {
        if (item.name) {
          this.getWarehouseStock(item.item_code).subscribe({
            next: res => {
              data[index].stock = res.message;
              this.dataSource.update(data);
            },
          });
        } else {
          data[index].stock = 'Select an Item';
          this.dataSource.update(data);
        }
      });
    } else {
      data.forEach((item, index) => {
        data[index].stock = 'Please select a Warehouse';
        this.dataSource.update(data);
      });
    }
  }

  getWarehouseStock(item_code: string) {
    return this.itemPriceService.getStockBalance(
      item_code,
      this.warehouseFormControl.value,
    );
  }

  updateItem(row: Item, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    Object.assign(row, item);
    if (this.warehouseFormControl.value) {
      this.getWarehouseStock(item.item_code).subscribe({
        next: res => {
          row.qty = 1;
          row.rate = item.rate;
          row.stock = res.message;
          this.calculateTotal(this.dataSource.data().slice());
          this.dataSource.update(copy);
        },
      });
    } else {
      row.qty = 1;
      row.rate = item.rate;
      row.stock = 'Please Select a Warehouse';
      this.calculateTotal(this.dataSource.data().slice());
      this.dataSource.update(copy);
    }
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.qty = quantity;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(copy);
  }

  updateRate(row: Item, rate: number) {
    if (rate == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    if (row.minimumPrice && row.minimumPrice > rate) {
      row.rate = row.minimumPrice;
    } else {
      row.rate = rate;
    }
    this.calculateTotal(this.dataSource.data().slice());

    this.dataSource.update(copy);
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(this.dataSource.data());
  }

  customerChanged(customer) {
    if (customer.credit_days) {
      const date = new Date();
      date.setDate(date.getDate() + customer.credit_days);
      this.dueDateFormControl.setValue(date);
    } else this.dueDateFormControl.setValue('');

    this.salesService.getAddress(customer.name).subscribe({
      next: res => {
        this.address = res;
      },
    });
    this.getRemainingBalance();
  }

  navigateBack() {
    this.location.back();
  }

  submitDraft() {
    const isValid = this.salesService.validateItemList(
      this.dataSource.data().map(item => item.item_code),
    );
    if (isValid) {
      const salesInvoiceDetails = {} as SalesInvoiceDetails;
      salesInvoiceDetails.customer = this.customerFormControl.value.customer_name;
      salesInvoiceDetails.isCampaign = this.campaignInvoiceFormControl.value;
      salesInvoiceDetails.company = this.companyFormControl.value;
      salesInvoiceDetails.posting_date = this.getParsedDate(
        this.postingDateFormControl.value,
      );
      salesInvoiceDetails.posting_time = this.getFrappeTime();
      salesInvoiceDetails.set_posting_time = 1;
      salesInvoiceDetails.due_date = this.getParsedDate(
        this.dueDateFormControl.value,
      );
      salesInvoiceDetails.territory = 'All Territories';
      salesInvoiceDetails.update_stock = 0;
      salesInvoiceDetails.total_qty = 0;
      salesInvoiceDetails.total = 0;
      salesInvoiceDetails.contact_email = this.customerFormControl.value.owner;
      salesInvoiceDetails.status = DRAFT;
      salesInvoiceDetails.remarks = this.remarks;
      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          salesInvoiceDetails.total_qty += item.qty;
          salesInvoiceDetails.total += item.amount;
          return item;
        }
      });
      salesInvoiceDetails.items = itemList;
      this.validateStock(itemList)
        .pipe(
          switchMap(info => {
            return this.salesService.createSalesInvoice(salesInvoiceDetails);
          }),
        )
        .subscribe({
          next: success => {
            this.location.back();
          },
          error: ({ message }) => {
            if (!message) message = UPDATE_ERROR;
            this.snackbar.open(message, 'Close', {
              duration: DURATION,
            });
          },
        });
    } else {
      this.snackbar.open('Error : Duplicate Items added.', CLOSE, {
        duration: DURATION,
      });
    }
  }

  updateSalesInvoice() {
    const isValid = this.salesService.validateItemList(
      this.dataSource.data().map(item => item.item_code),
    );
    if (isValid) {
      const salesInvoiceDetails = {} as SalesInvoiceDetails;
      salesInvoiceDetails.customer = this.customerFormControl.value.customer_name;
      salesInvoiceDetails.isCampaign = this.campaignInvoiceFormControl.value;
      salesInvoiceDetails.company = this.companyFormControl.value;
      salesInvoiceDetails.posting_date = this.getParsedDate(
        this.postingDateFormControl.value,
      );
      salesInvoiceDetails.posting_time = this.getFrappeTime();
      salesInvoiceDetails.set_posting_time = 1;
      salesInvoiceDetails.due_date = this.getParsedDate(
        this.dueDateFormControl.value,
      );
      salesInvoiceDetails.territory = 'All Territories';
      salesInvoiceDetails.update_stock = 0;
      salesInvoiceDetails.total_qty = 0;
      salesInvoiceDetails.total = 0;
      salesInvoiceDetails.contact_email = this.customerFormControl.value.owner;
      salesInvoiceDetails.status = DRAFT;
      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          salesInvoiceDetails.total_qty += item.qty;
          salesInvoiceDetails.total += item.amount;
          return item;
        }
      });

      salesInvoiceDetails.items = itemList;
      salesInvoiceDetails.uuid = this.invoiceUuid;
      this.validateStock(itemList)
        .pipe(
          switchMap(info => {
            return this.salesService.updateSalesInvoice(salesInvoiceDetails);
          }),
        )
        .subscribe({
          next: res => {
            this.location.back();
          },
          error: ({ message }) => {
            if (!message) message = UPDATE_ERROR;
            this.snackbar.open(message, 'Close', {
              duration: DURATION,
            });
          },
        });
    } else {
      this.snackbar.open('Error : Duplicate Items added.', 'Close', {
        duration: DURATION,
      });
    }
  }

  calculateTotal(itemList: Item[]) {
    this.total = 0;
    itemList.forEach(item => {
      this.total += item.qty * item.rate;
    });
  }

  selectedPostingDate($event) {
    this.postingDate = this.getParsedDate($event.value);
  }

  selectedDueDate($event) {
    this.dueDate = this.getParsedDate($event.value);
  }

  getFrappeTime() {
    const date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
  }

  getParsedDate(value) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }

  getOptionText(option) {
    if (option) return option.customer_name;
  }

  getApiInfo() {
    return this.salesService.getApiInfo();
  }

  validateStock(itemList: Item[] = []) {
    return this.salesService.getApiInfo().pipe(
      switchMap(info => {
        if (info.validateStock) {
          return from(itemList).pipe(
            mergeMap(item => {
              if (item.qty > item.stock) {
                return throwError({ message: INSUFFICIENT_STOCK_BALANCE });
              }
              return of(item);
            }),
          );
        }
        return of(info);
      }),
    );
  }

  getRemainingBalance() {
    forkJoin({
      time: from(this.time.getDateTime(new Date())),
      token: from(this.salesService.getStore().getItem(ACCESS_TOKEN)),
      debtorAccount: this.getApiInfo().pipe(map(res => res.debtorAccount)),
    })
      .pipe(
        switchMap(({ token, time, debtorAccount }) => {
          if (!debtorAccount) {
            return throwError({ debtorAccountNotFound: true });
          }
          const headers = {
            [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
          };
          return this.itemPriceService.getRemainingBalance(
            debtorAccount,
            time,
            'Customer',
            this.customerFormControl.value.name,
            this.companyFormControl.value,
            headers,
          );
        }),
      )
      .subscribe({
        next: message => {
          // credit limit defaults to twice the debtor
          let creditLimit = message;
          const creditLimits: {
            company: string;
            credit_limit: number;
          }[] = this.customerFormControl.value.credit_limits;

          const limits = creditLimits.filter(
            limit => limit.company === this.companyFormControl.value,
          );

          if (limits.length) {
            creditLimit = Number(limits[0].credit_limit) - Number(message);
          }

          this.remainingBalanceFormControl.setValue(creditLimit);
        },
        error: error => {
          let frappeError = error.message || UPDATE_ERROR;

          try {
            frappeError = JSON.parse(error.error._server_messages);
            frappeError = JSON.parse(frappeError);
            frappeError = (frappeError as { message?: string }).message;
          } catch {}

          this.snackbar.open(frappeError, CLOSE, { duration: SHORT_DURATION });
        },
      });
  }
}
