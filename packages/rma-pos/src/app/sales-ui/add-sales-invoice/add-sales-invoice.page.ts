import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import {
  FormControl,
  Validators,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Observable, throwError, of, from, forkJoin } from 'rxjs';
import {
  startWith,
  switchMap,
  filter,
  map,
  mergeMap,
  toArray,
  concatMap,
} from 'rxjs/operators';
import { Location } from '@angular/common';
import { SalesInvoice, Item } from '../../common/interfaces/sales.interface';
import { ItemsDataSource } from './items-datasource';
import { SalesService } from '../services/sales.service';
import {
  Payments,
  SalesInvoiceDetails,
} from '../view-sales-invoice/details/details.component';
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
  TERRITORY,
  WAREHOUSES,
} from '../../constants/app-string';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemPriceService } from '../services/item-price.service';
import { INSUFFICIENT_STOCK_BALANCE } from '../../constants/messages';
import { TimeService } from '../../api/time/time.service';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../constants/date-format';
import { ValidateInputSelected } from '../../common/pipes/validators';
import { SerialSearchFields } from '../../common/interfaces/search-fields.interface';

@Component({
  selector: 'app-add-sales-invoice',
  templateUrl: './add-pos-invoice.html',
  styleUrls: ['./add-sales-invoice.page.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AddSalesInvoicePage implements OnInit {
  isLoadMoreVisible: boolean = true;
  isSkeletonTextVisible: boolean = true;
  salesInvoice: SalesInvoice;
  invoiceUuid: string;
  calledFrom: string;
  dataSource: ItemsDataSource;
  series: string;
  initial: { [key: string]: number } = {
    warehouse: 0,
    territory: 0,
  };
  postingDate: string;
  dueDate: string;
  address = {} as any;
  displayedColumns = ['item', 'stock', 'quantity', 'rate', 'total', 'delete'];
  filteredWarehouseList: Observable<any[]>;
  territoryList: Observable<any[]>;
  filteredCustomerList: Observable<any[]>;
  salesInvoiceItemsForm = new FormGroup({
    items: new FormArray([], this.itemValidator),
    total: new FormControl(0),
    filterKey: new FormControl('Item Code'),
    filterValue: new FormControl(),
  });
  itemsControl: FormArray = this.salesInvoiceItemsForm.get(
    'items',
  ) as FormArray;

  salesCustomerDetialsForm: FormGroup;
  paymentForm: FormGroup;
  validateInput: any = ValidateInputSelected;
  filteredModeOfPaymentList: Observable<any[]>;
  filteredPosProfileList: Observable<any[]>;
  gridItems: Item[] = [];
  filterOptions: any[] = ['Item Code', 'Serial No'];
  isDataLoading = false;

  get f() {
    return this.salesCustomerDetialsForm.controls;
  }
  get salesInvoiceItemsFormControls() {
    return this.salesInvoiceItemsForm.controls;
  }
  get paymentFormControls() {
    return this.paymentForm.controls;
  }

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
    this.getItemList().subscribe({
      next: res => {
        this.gridItems = [...res.items];
        this.showLoadMore(res.totalLength);
        this.isSkeletonTextVisible = false;
      },
    });

    this.createFormGroup();
    this.dataSource = new ItemsDataSource();
    this.salesInvoice = {} as SalesInvoice;
    this.series = '';
    this.salesCustomerDetialsForm.get('postingDate').setValue(new Date());
    this.calledFrom = this.route.snapshot.params.calledFrom;
    if (this.calledFrom === 'edit') {
      this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
      this.salesService.getSalesInvoice(this.invoiceUuid).subscribe({
        next: async (res: SalesInvoiceDetails) => {
          this.salesCustomerDetialsForm.get('company').setValue(res.company);
          this.salesCustomerDetialsForm
            .get('territory')
            .setValue(res.territory);
          this.salesCustomerDetialsForm.get('customer').setValue({
            name: res.customer,
            owner: res.contact_email,
            customer_name: res.customer_name,
          });
          this.salesCustomerDetialsForm
            .get('postingDate')
            .setValue(new Date(res.posting_date));
          this.salesCustomerDetialsForm
            .get('dueDate')
            .setValue(new Date(res.due_date));

          this.paymentForm.get('modeOfPayment').setValue(
            res.payments.find(x => {
              return x;
            }).mode_of_payment,
          );
          this.paymentForm
            .get('posProfile')
            .setValue(
              await this.salesService
                .getPosProfileById(res.pos_profile)
                .toPromise(),
            );

          this.dataSource.loadItems(res.items);
          res.items.forEach(item => {
            this.itemsControl.push(new FormControl(item));
          });
          this.calculateTotal(res.items);
          this.salesCustomerDetialsForm
            .get('campaign')
            .setValue(res.isCampaign);
          this.salesCustomerDetialsForm.get('remarks').setValue(res.remarks);
          this.salesCustomerDetialsForm
            .get('warehouse')
            .setValue(res.delivery_warehouse);
          this.updateStockBalance(res.delivery_warehouse);
          this.getCustomer(res.customer);
        },
      });
    }
    this.filteredCustomerList = this.salesCustomerDetialsForm
      .get('customer')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getCustomerList(value);
        }),
      );

    this.filteredWarehouseList = this.salesCustomerDetialsForm
      .get('warehouse')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getStore().getItemAsync(WAREHOUSES, value);
        }),
        switchMap(data => {
          if (data && data.length) {
            this.initial.warehouse
              ? null
              : (this.salesCustomerDetialsForm
                  .get('warehouse')
                  .setValue(data[0]),
                this.initial.warehouse++);
            return of(data);
          }
          return of([]);
        }),
      );

    this.territoryList = this.salesCustomerDetialsForm
      .get('territory')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getStore().getItemAsync(TERRITORY, value);
        }),
        switchMap(data => {
          if (data && data.length) {
            this.initial.territory
              ? null
              : (this.salesCustomerDetialsForm
                  .get('territory')
                  .setValue(data[0]),
                this.initial.territory++);
            return of(data);
          }
          return of([]);
        }),
      );

    this.filteredModeOfPaymentList = this.paymentForm
      .get('modeOfPayment')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getModeOfPayment([
            ['name', 'like', `%${value}%`],
          ]);
        }),
      );

    this.filteredPosProfileList = this.paymentForm
      .get('posProfile')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getPosProfile([
            ['name', 'like', `%${value}%`],
          ]);
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
                this.salesCustomerDetialsForm
                  .get('company')
                  .setValue(items[DEFAULT_COMPANY]);
                this.getRemainingBalance();
              } else {
                this.getApiInfo().subscribe({
                  next: res => {
                    this.salesCustomerDetialsForm
                      .get('company')
                      .setValue(res.defaultCompany);
                  },
                  error: error => {},
                });
              }
            });
        },
        error: error => {},
      });
  }

  createFormGroup() {
    this.salesCustomerDetialsForm = new FormGroup(
      {
        warehouse: new FormControl('', Validators.required),
        company: new FormControl('', Validators.required),
        customer: new FormControl('', Validators.required),
        postingDate: new FormControl('', Validators.required),
        dueDate: new FormControl('', Validators.required),
        territory: new FormControl('', Validators.required),
        campaign: new FormControl(false),
        balance: new FormControl(0),
        remarks: new FormControl(''),
      },
      // {
      //   validators: [this.dueDateValidator, this.creditLimitValidator],
      // },
    );
    this.paymentForm = new FormGroup({
      modeOfPayment: new FormControl('', Validators.required),
      posProfile: new FormControl('', Validators.required),
    });
  }

  dueDateValidator(abstractControl: AbstractControl) {
    const dueDate = new Date(abstractControl.get('dueDate').value);
    if (!dueDate) {
      abstractControl.get('dueDate').setErrors({ required: true });
      return;
    }
    const postingDate = new Date(abstractControl.get('postingDate').value);

    if (dueDate.setHours(0, 0, 0, 0) < postingDate.setHours(0, 0, 0, 0)) {
      abstractControl.get('dueDate').setErrors({ dueDate: true });
    } else return null;
  }

  creditLimitValidator(abstractControl: AbstractControl) {
    const balance = abstractControl.get('balance').value;
    const total = abstractControl.get('total').value;
    if (balance < total) {
      abstractControl.get('balance').markAsTouched();
      abstractControl.get('customer').markAsTouched();
      abstractControl.get('balance').setErrors({ min: true });
    } else abstractControl.get('balance').setErrors(null);
  }

  itemValidator(items: FormArray) {
    if (items.length === 0) {
      return { items: true };
    } else {
      const itemList = items
        .getRawValue()
        .filter(item => item.item_name !== '');
      if (itemList.length !== items.length) {
        return { items: true };
      } else return null;
    }
  }

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.item_code = '';
    item.minimumPrice = 0;
    item.stock = this.salesCustomerDetialsForm.get('warehouse').value
      ? 'Select an Item'
      : '';
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
  }

  updateStockBalance(warehouse) {
    const data = this.dataSource.data();
    if (warehouse) {
      data.forEach((item, index) => {
        if (item.name) {
          this.getWarehouseStock(item).subscribe({
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

  getWarehouseStock(item: {
    item_code: string;
    bundle_items?: any[];
    has_bundle_item?: boolean;
    is_stock_item?: number;
  }) {
    if (item.bundle_items || item.has_bundle_item || item.is_stock_item === 0) {
      return of({ message: 1000000 });
    }
    return this.itemPriceService.getStockBalance(
      item.item_code,
      this.salesCustomerDetialsForm.get('warehouse').value,
    );
  }

  updateItem(row: Item, index: number, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    Object.assign(row, item);
    if (this.salesCustomerDetialsForm.get('warehouse').value) {
      this.getWarehouseStock(item).subscribe({
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
    this.itemsControl.controls[index].setValue(item);
  }

  addFromItemsGrid(newItem: Item) {
    this.salesService
      .getItemFromRMAServer(newItem.item_code)
      .pipe(
        switchMap(item => {
          return this.getWarehouseStock(item).pipe(
            map(stock => {
              return { item, stock };
            }),
          );
        }),
      )
      .subscribe({
        next: res => {
          const item = this.dataSource.data();
          if (item.find(x => x.uuid === res.item.uuid)) {
            const index = item.findIndex(x => x.uuid === res.item.uuid);
            item[index].qty = item[index].qty + 1;
            this.calculateTotal(this.dataSource.data().slice());
            this.dataSource.update(item);
          } else {
            newItem.uuid = res.item.uuid;
            newItem.minimumPrice = res.item.minimumPrice;
            newItem.has_serial_no = res.item.has_serial_no;
            newItem.qty = 1;
            newItem.rate = newItem.rate ? newItem.rate : 0;
            newItem.stock = this.salesCustomerDetialsForm.get('warehouse').value
              ? res.stock.message
              : 'Please Select a Warehouse';
            item.push(newItem);
            this.calculateTotal(item.slice());
            this.dataSource.update(item);
            this.itemsControl.push(new FormControl(newItem));
          }
        },
      });
  }

  loadMoreData() {
    this.isDataLoading = true;
    if (this.salesInvoiceItemsForm.controls.filterKey.value === 'Item Code') {
      this.getItemList(this.gridItems ? this.gridItems.length / 30 : 0, {
        item_code: this.salesInvoiceItemsForm.controls.filterValue.value,
      }).subscribe({
        next: res => {
          this.isDataLoading = false;
          this.gridItems = [...this.gridItems, ...res.items];
          this.showLoadMore(res?.totalLength);
        },
      });
    } else if (
      this.salesInvoiceItemsForm.controls.filterKey.value === 'Serial No'
    ) {
      this.getItemsWithSerial(
        this.gridItems ? this.gridItems.length / 30 : 0,
      ).subscribe({
        next: res => {
          this.isDataLoading = false;
          this.gridItems = [...this.gridItems, ...res.items];
          this.showLoadMore(res.totalLength);
        },
      });
    }
  }

  showLoadMore(totalLength?: number) {
    if (this.gridItems.length === totalLength) {
      this.isLoadMoreVisible = false;
    } else {
      this.isLoadMoreVisible = true;
    }
  }

  setFilter() {
    this.isSkeletonTextVisible = true;
    this.gridItems = [];
    if (this.salesInvoiceItemsForm.controls.filterKey.value === 'Serial No') {
      this.getItemsWithSerial().subscribe({
        next: res => {
          this.isSkeletonTextVisible = false;
          this.gridItems = [...res.items];
          this.showLoadMore(res.totalLength);
        },
      });
    } else if (
      this.salesInvoiceItemsForm.controls.filterKey.value === 'Item Code'
    ) {
      this.getItemList(0, {
        item_code: this.salesInvoiceItemsForm.controls.filterValue.value,
      }).subscribe({
        next: res => {
          this.isSkeletonTextVisible = false;
          this.gridItems = [...res.items];
          this.showLoadMore(res.totalLength);
        },
      });
    }
  }

  getItemList(pageIndex = 0, filters?: { [key: string]: any }) {
    return this.salesService
      .getItemList(undefined, undefined, pageIndex, undefined, filters)
      .pipe(
        switchMap(itemList => {
          return from(itemList.docs ? itemList.docs : []).pipe(
            concatMap((item: Item) => {
              return this.salesService.getItemPrice(item.item_code).pipe(
                switchMap(res => {
                  res.find(x => (item.rate = x.price_list_rate));
                  return of(item);
                }),
              );
            }),
            toArray(),
            switchMap(item => {
              return of({ items: item, totalLength: itemList.length });
            }),
          );
        }),
      );
  }

  getItemsWithSerial(pageIndex = 0) {
    return this.salesService
      .getSerialList(this.getFilterQuery(), undefined, pageIndex)
      .pipe(
        switchMap(res => {
          return from(res.docs ? res.docs : []).pipe(
            concatMap(serialInfo => {
              return this.salesService.getItemPrice(serialInfo.item_code).pipe(
                switchMap(res => {
                  res.find(x => (serialInfo.rate = x.price_list_rate));
                  return of(serialInfo);
                }),
              );
            }),
            toArray(),
            switchMap(item => {
              return of({ items: item, totalLength: res.length });
            }),
          );
        }),
      );
  }

  getFilterQuery() {
    const query: SerialSearchFields = {};
    query.serial_no = {
      $regex: this.salesInvoiceItemsForm.controls.filterValue.value
        ? this.salesInvoiceItemsForm.controls.filterValue.value
        : '',
      $options: 'i',
    };
    return query;
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
    this.itemsControl.removeAt(i);
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(this.dataSource.data());
  }

  customerChanged(customer, postingDate?) {
    if (customer.credit_days) {
      let date;
      postingDate ? (date = new Date(postingDate)) : (date = new Date());
      date.setDate(date.getDate() + customer.credit_days);
      this.salesCustomerDetialsForm.get('dueDate').setValue(date);
    }
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
      salesInvoiceDetails.customer = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.name;
      salesInvoiceDetails.isCampaign = this.salesCustomerDetialsForm.get(
        'campaign',
      ).value;
      salesInvoiceDetails.company = this.salesCustomerDetialsForm.get(
        'company',
      ).value;
      salesInvoiceDetails.posting_date = this.getParsedDate(
        this.salesCustomerDetialsForm.get('postingDate').value,
      );
      salesInvoiceDetails.posting_time = this.getFrappeTime();
      salesInvoiceDetails.set_posting_time = 1;
      salesInvoiceDetails.due_date = this.getParsedDate(
        this.salesCustomerDetialsForm.get('dueDate').value,
      );
      salesInvoiceDetails.territory = this.salesCustomerDetialsForm.get(
        'territory',
      ).value;
      salesInvoiceDetails.update_stock = 0;
      salesInvoiceDetails.total_qty = 0;
      salesInvoiceDetails.total = 0;
      salesInvoiceDetails.contact_email = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.owner;
      salesInvoiceDetails.customer = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.name;
      salesInvoiceDetails.customer_name = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.customer_name;
      salesInvoiceDetails.status = DRAFT;
      salesInvoiceDetails.remarks = this.salesCustomerDetialsForm.get(
        'remarks',
      ).value;
      salesInvoiceDetails.delivery_warehouse = this.salesCustomerDetialsForm.get(
        'warehouse',
      ).value;

      salesInvoiceDetails.is_pos = true;
      const paymentDetails: Payments[] = [];
      paymentDetails.push({
        mode_of_payment: this.paymentForm.get('modeOfPayment').value,
        default: true,
        amount: this.salesInvoiceItemsForm.controls.total.value,
        account: this.paymentForm.get('posProfile').value
          .account_for_change_amount,
      });
      salesInvoiceDetails.payments = paymentDetails;
      salesInvoiceDetails.pos_profile = this.paymentForm.get(
        'posProfile',
      ).value.name;
      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          salesInvoiceDetails.total_qty += item.qty;
          salesInvoiceDetails.total += item.amount;
          item.has_bundle_item =
            item.has_bundle_item || item.bundle_items ? true : false;
          item.is_stock_item = item.is_stock_item;
          return item;
        }
      });
      salesInvoiceDetails.items = itemList;
      if (this.salesCustomerDetialsForm.get('customer').value.sales_team) {
        salesInvoiceDetails.sales_team = this.salesCustomerDetialsForm.get(
          'customer',
        ).value.sales_team;

        for (const sales_person of salesInvoiceDetails.sales_team) {
          sales_person.allocated_amount =
            (sales_person.allocated_percentage / 100) *
            salesInvoiceDetails.total;
        }
      }
      this.validateStock(itemList)
        .pipe(
          switchMap(info => {
            return this.salesService.createSalesInvoice(salesInvoiceDetails);
          }),
        )
        .subscribe({
          next: success => {
            this.router.navigate(['sales', 'view-sales-invoice', success.uuid]);
          },
          error: err => {
            // bad way of doing error's do not follow this. message should always be thrown ideally as err.error.message in exception.
            let message = err?.error?.message || '';
            if (!message) {
              try {
                message = err.message ? err.message : JSON.stringify(err);
              } catch {
                message = UPDATE_ERROR;
              }
            }
            this.snackbar.open(message, 'Close', {
              duration: 3000,
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
      salesInvoiceDetails.customer = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.name;
      salesInvoiceDetails.isCampaign = this.salesCustomerDetialsForm.get(
        'campaign',
      ).value;
      salesInvoiceDetails.territory = this.salesCustomerDetialsForm.get(
        'territory',
      ).value;
      salesInvoiceDetails.company = this.salesCustomerDetialsForm.get(
        'company',
      ).value;
      salesInvoiceDetails.posting_date = this.getParsedDate(
        this.salesCustomerDetialsForm.get('postingDate').value,
      );
      salesInvoiceDetails.posting_time = this.getFrappeTime();
      salesInvoiceDetails.set_posting_time = 1;
      salesInvoiceDetails.due_date = this.getParsedDate(
        this.salesCustomerDetialsForm.get('dueDate').value,
      );
      salesInvoiceDetails.update_stock = 0;
      salesInvoiceDetails.total_qty = 0;
      salesInvoiceDetails.total = 0;
      salesInvoiceDetails.customer = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.name;
      salesInvoiceDetails.customer_name = this.salesCustomerDetialsForm.get(
        'customer',
      ).value.customer_name;
      salesInvoiceDetails.delivery_warehouse = this.salesCustomerDetialsForm.get(
        'warehouse',
      ).value;
      salesInvoiceDetails.status = DRAFT;
      salesInvoiceDetails.remarks = this.salesCustomerDetialsForm.get(
        'remarks',
      ).value;

      salesInvoiceDetails.is_pos = true;
      const paymentDetails: Payments[] = [];
      paymentDetails.push({
        mode_of_payment: this.paymentForm.get('modeOfPayment').value,
        default: true,
        amount: this.salesInvoiceItemsForm.controls.total.value,
        account: this.paymentForm.get('posProfile').value
          .account_for_change_amount,
      });
      salesInvoiceDetails.payments = paymentDetails;
      salesInvoiceDetails.pos_profile = this.paymentForm.get(
        'posProfile',
      ).value.name;

      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          salesInvoiceDetails.total_qty += item.qty;
          salesInvoiceDetails.total += item.amount;
          item.has_bundle_item =
            item.has_bundle_item || item.bundle_items ? true : false;
          item.is_stock_item = item.is_stock_item;
          return item;
        }
      });

      salesInvoiceDetails.items = itemList;
      salesInvoiceDetails.uuid = this.invoiceUuid;
      if (this.salesCustomerDetialsForm.get('customer').value.sales_team) {
        salesInvoiceDetails.sales_team = this.salesCustomerDetialsForm.get(
          'customer',
        ).value.sales_team;

        for (const sales_person of salesInvoiceDetails.sales_team) {
          sales_person.allocated_amount =
            (sales_person.allocated_percentage / 100) *
            salesInvoiceDetails.total;
        }
      }
      this.validateStock(itemList)
        .pipe(
          switchMap(info => {
            return this.salesService.updateSalesInvoice(salesInvoiceDetails);
          }),
        )
        .subscribe({
          next: res => {
            this.router.navigate(['sales', 'view-sales-invoice', res.uuid]);
          },
          error: err => {
            let message = err?.error?.message || '';
            if (!message) {
              try {
                message = err.message ? err.message : JSON.stringify(err);
              } catch {
                message = UPDATE_ERROR;
              }
            }
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
    let sum = 0;
    itemList.forEach(item => {
      sum += item.qty * item.rate;
    });
    this.salesInvoiceItemsForm.get('total').setValue(sum);
  }

  selectedPostingDate($event) {
    this.postingDate = this.getParsedDate($event.value);
    this.customerChanged(this.f.customer.value, $event.value);
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
    if (option) {
      if (option.customer_name) {
        return `${option.customer_name} (${option.name})`;
      }
      return option.name;
    }
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
      toArray(),
      switchMap(success => of(true)),
    );
  }

  getCustomer(name: string) {
    this.salesService.getCustomer(name).subscribe({
      next: res => {
        this.salesCustomerDetialsForm.get('customer').setValue(res);
        this.customerChanged(res);
      },
    });
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
            return throwError({
              message: 'Please select Debtor Account in settings',
            });
          }
          const headers = {
            [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
          };
          return this.itemPriceService.getRemainingBalance(
            debtorAccount,
            time,
            'Customer',
            this.salesCustomerDetialsForm.get('customer').value.name,
            this.salesCustomerDetialsForm.get('company').value,
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
          }[] = this.salesCustomerDetialsForm.get('customer').value
            .credit_limits;

          const limits = creditLimits.filter(
            limit =>
              limit.company ===
              this.salesCustomerDetialsForm.get('company').value,
          );

          if (limits.length) {
            creditLimit = Number(limits[0].credit_limit) - Number(message);
          }

          this.salesCustomerDetialsForm.get('balance').setValue(creditLimit);
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

  displayPosProfileName(option) {
    return option.name;
  }
}
