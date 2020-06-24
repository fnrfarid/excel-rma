import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import { ItemsDataSource } from '../../../../sales-ui/add-sales-invoice/items-datasource';
import {
  Item,
  WarrantyClaimsDetails,
} from '../../../../common/interfaces/warranty.interface';
import { AddServiceInvoiceService } from './add-service-invoice.service';
import { Observable } from 'rxjs';
import { startWith, switchMap, map, debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceInvoiceDetails } from './service-invoice-interface';
import {
  SUBMITTED,
  UPDATE_ERROR,
  DURATION,
  CLOSE,
} from '../../../../constants/app-string';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-service-invoice',
  templateUrl: './add-service-invoice.page.html',
  styleUrls: ['./add-service-invoice.page.scss'],
})
export class AddServiceInvoicePage implements OnInit {
  postingDate: { date: string; time: string };
  serviceInvoiceForm: FormGroup;
  dataSource: ItemsDataSource;
  itemsControl: FormArray;
  displayedColumns: string[] = [
    'item_group',
    'item_name',
    'quantity',
    'rate',
    'total',
    'delete',
  ];
  filteredCustomerList: Observable<any[]>;
  filteredWarehouseList: Observable<any[]>;
  warrantyDetails: WarrantyClaimsDetails;
  date: Date;
  get f() {
    return this.serviceInvoiceForm.controls;
  }
  async getCurrentDate() {
    const date = new Date();
    const DateTime = await this.time.getDateAndTime(date);
    this.date = DateTime.date;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
    private readonly serviceInvoiceService: AddServiceInvoiceService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly snackbar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.createFormGroup();
    this.getCurrentDate();
    this.dataSource = new ItemsDataSource();

    this.filteredWarehouseList = this.serviceInvoiceForm
      .get('branch')
      .valueChanges.pipe(
        debounceTime(500),
        startWith(''),
        switchMap(value => {
          return this.serviceInvoiceService
            .getWarehouseList(value)
            .pipe(map(res => res.docs));
        }),
      );
    this.filteredCustomerList = this.serviceInvoiceForm
      .get('customerName')
      .valueChanges.pipe(
        debounceTime(500),
        startWith(''),
        switchMap(value => {
          return this.serviceInvoiceService
            .getCustomerList(value)
            .pipe(map(res => res.docs));
        }),
      );
    this.serviceInvoiceService
      .getWarrantyDetail(this.activatedRoute.snapshot.params.uuid)
      .subscribe({
        next: (res: WarrantyClaimsDetails) => {
          this.serviceInvoiceForm.get('customerName').setValue(res.customer);
          this.serviceInvoiceForm
            .get('customerContact')
            .setValue(res.customer_contact);
          this.serviceInvoiceForm
            .get('customerAddress')
            .setValue(res.customer_address);
          this.serviceInvoiceForm
            .get('thirdPartyName')
            .setValue(res.third_party_name);
          this.serviceInvoiceForm
            .get('thirdPartyContact')
            .setValue(res.third_party_contact);
          this.serviceInvoiceForm
            .get('thirdPartyAddress')
            .setValue(res.third_party_address);
          this.serviceInvoiceForm.get('postingDate').setValue(this.date);
          this.serviceInvoiceForm.get('branch').setValue(res.receiving_branch);
          this.warrantyDetails = res;
        },
        error: err => {},
      });
  }

  createFormGroup() {
    this.serviceInvoiceForm = new FormGroup({
      customerName: new FormControl('', [Validators.required]),
      customerContact: new FormControl('', [Validators.required]),
      customerAddress: new FormControl('', [Validators.required]),
      thirdPartyName: new FormControl('', [Validators.required]),
      thirdPartyContact: new FormControl('', [Validators.required]),
      thirdPartyAddress: new FormControl('', [Validators.required]),
      account: new FormControl('', [Validators.required]),
      postingDate: new FormControl('', [Validators.required]),
      branch: new FormControl('', [Validators.required]),
      items: new FormArray([], this.itemValidator),
      total: new FormControl(0),
    });
    this.itemsControl = this.serviceInvoiceForm.get('items') as FormArray;
  }

  navigateBack() {
    this.location.back();
  }

  async selectedPostingDate($event) {
    this.postingDate = await this.time.getDateAndTime($event.value);
  }

  submitDraft() {
    const isValid = this.serviceInvoiceService.validateItemList(
      this.dataSource.data().map(item => item.item_code),
    );
    if (isValid) {
      const serviceInvoiceDetails = {} as ServiceInvoiceDetails;
      serviceInvoiceDetails.customer = this.serviceInvoiceForm.get(
        'customerName',
      ).value;
      serviceInvoiceDetails.customer_contact = this.serviceInvoiceForm.get(
        'customerContact',
      ).value;
      serviceInvoiceDetails.total_qty = 0;
      serviceInvoiceDetails.total = 0;
      serviceInvoiceDetails.status = SUBMITTED;
      serviceInvoiceDetails.due_date = this.serviceInvoiceForm.get(
        'postingDate',
      ).value;
      serviceInvoiceDetails.remarks = this.warrantyDetails.remarks;
      serviceInvoiceDetails.date = this.serviceInvoiceForm.get(
        'postingDate',
      ).value;
      serviceInvoiceDetails.customer_third_party = this.warrantyDetails.claim_type;
      serviceInvoiceDetails.branch = this.serviceInvoiceForm.get(
        'branch',
      ).value;
      serviceInvoiceDetails.posting_date = this.serviceInvoiceForm.get(
        'postingDate',
      ).value;
      serviceInvoiceDetails.customer_name = this.serviceInvoiceForm.get(
        'customerName',
      ).value;
      serviceInvoiceDetails.customer_address = this.serviceInvoiceForm.get(
        'customerAddress',
      ).value;
      serviceInvoiceDetails.third_party_name = this.serviceInvoiceForm.get(
        'thirdPartyName',
      ).value;
      serviceInvoiceDetails.third_party_address = this.serviceInvoiceForm.get(
        'thirdPartyAddress',
      ).value;
      serviceInvoiceDetails.third_party_contact = this.serviceInvoiceForm.get(
        'thirdPartyContact',
      ).value;
      serviceInvoiceDetails.docstatus = 1;

      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          serviceInvoiceDetails.total_qty += item.qty;
          serviceInvoiceDetails.total += item.amount;
          return item;
        }
      });
      serviceInvoiceDetails.items = itemList;

      return this.serviceInvoiceService
        .createServiceInvoice(serviceInvoiceDetails)
        .subscribe({
          next: () => {
            this.router.navigate([
              '/warranty/view-warranty-claims',
              this.activatedRoute.snapshot.params.uuid,
            ]);
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

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_code = '';
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.minimumPrice = 0;
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
  }

  updateItem(row: Item, index: number, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    Object.assign(row, item);
    row.item_group = item.item_group;
    row.qty = 1;
    row.rate = item.rate;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(copy);
    this.itemsControl.controls[index].setValue(item);
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

  calculateTotal(itemList: Item[]) {
    let sum = 0;
    itemList.forEach(item => {
      sum += item.qty * item.rate;
    });
    this.serviceInvoiceForm.get('total').setValue(sum);
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.itemsControl.removeAt(i);
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(this.dataSource.data());
  }
}
