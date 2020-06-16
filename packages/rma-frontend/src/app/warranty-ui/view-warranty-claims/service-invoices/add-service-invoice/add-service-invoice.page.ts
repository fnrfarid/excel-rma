import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import { ItemsDataSource } from '../../../../sales-ui/add-sales-invoice/items-datasource';
import { Item } from '../../../../common/interfaces/warranty.interface';
import { AddServiceInvoiceService } from './add-service-invoice.service';
import { Observable } from 'rxjs';
import { startWith, switchMap, map, debounceTime } from 'rxjs/operators';

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
  address = {} as any;
  get f() {
    return this.serviceInvoiceForm.controls;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
    private readonly serviceInvoiceService: AddServiceInvoiceService,
  ) {}

  ngOnInit() {
    this.createFormGroup();
    this.dataSource = new ItemsDataSource();

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
  }
  createFormGroup() {
    this.serviceInvoiceForm = new FormGroup({
      warehouse: new FormControl('', [Validators.required]),
      customerName: new FormControl('', [Validators.required]),
      customerContact: new FormControl('', [Validators.required]),
      customerAddress: new FormControl('', [Validators.required]),
      thirdPartyName: new FormControl('', [Validators.required]),
      thirdPartyContact: new FormControl('', [Validators.required]),
      thirdPartyAddress: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
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

  submitDraft() {}

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

  getOptionText(option) {
    if (option) return option.customer_name;
  }

  customerChanged(customer) {
    this.serviceInvoiceService.getAddress(customer.name).subscribe({
      next: res => {
        this.address = res;
      },
    });
  }
}
