import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import { ItemsDataSource } from '../../../../sales-ui/add-sales-invoice/items-datasource';
import { Item } from '../../../../common/interfaces/sales.interface';
import { WarrantyClaimsDetails } from '../../../../common/interfaces/warranty.interface';
import { ActivatedRoute } from '@angular/router';
import {
  WARRANTY_TYPE,
  STOCK_ENTRY_STATUS,
} from '../../../../constants/app-string';
import { AddServiceInvoiceService } from '../../service-invoices/add-service-invoice/add-service-invoice.service';

@Component({
  selector: 'app-add-stock-entry',
  templateUrl: './add-stock-entry.page.html',
  styleUrls: ['./add-stock-entry.page.scss'],
})
export class AddStockEntryPage implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;

  dataSource: ItemsDataSource;
  stockEntryForm: FormGroup;
  type: Array<any> = [];
  itemsControl: FormArray;
  displayedColumns: string[] = [
    'serial_no',
    'item_name',
    'source_warehouse',
    'target_warehouse',
    'quantity',
    'rate',
    'total',
    'delete',
  ];

  get formControl() {
    return this.stockEntryForm.controls;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
    private readonly addServiceInvoiceService: AddServiceInvoiceService,
    private readonly router: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.type = Object.keys(STOCK_ENTRY_STATUS).map(
      key => STOCK_ENTRY_STATUS[key],
    );
    this.dataSource = new ItemsDataSource();
    this.createFormGroup();
    this.setDateTime(new Date());
    this.addServiceInvoiceService
      .getWarrantyDetail(this.router.snapshot.params.uuid)
      .subscribe({
        next: res => {
          this.warrantyObject = res;
        },
      });
  }

  navigateBack() {
    this.location.back();
  }

  submitDraft() {}

  createFormGroup() {
    this.stockEntryForm = new FormGroup({
      type: new FormControl('', [Validators.required]),
      date: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      items: new FormArray([], this.itemValidator),
      total: new FormControl(0),
    });
    this.itemsControl = this.stockEntryForm.controls.items as FormArray;
  }

  async setDateTime(date: Date) {
    const dateTime = await this.time.getDateAndTime(date);
    this.stockEntryForm.controls.date.setValue(dateTime.date);
  }

  getOption(option) {
    if (option) return option;
  }

  selectedPostingDate($event) {}

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

  getFormState(state) {
    this.trimRow();
    if (state === STOCK_ENTRY_STATUS.REPLACE) {
      if (this.warrantyObject.claim_type === WARRANTY_TYPE.NON_SERAIL) {
        this.addServiceInvoiceService
          .getItemFromRMAServer(this.warrantyObject.item_code)
          .subscribe({
            next: res => {
              this.AddItem(res);
            },
          });
      } else {
        this.addServiceInvoiceService
          .getSerial(this.warrantyObject.serial_no)
          .subscribe({
            next: res => {
              this.AddItem(res);
            },
          });
      }
    }
  }

  trimRow() {
    for (let index = 0; index <= this.dataSource.data().length; index++) {
      this.dataSource.data().splice(0, 1);
      this.itemsControl.removeAt(0);
      this.calculateTotal(this.dataSource.data().slice());
      this.dataSource.update(this.dataSource.data());
    }
  }

  AddItem(item: Item) {
    const itemDataSource = this.dataSource.data();
    if (!item.serial_no) {
      itemDataSource.push({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: 1,
        rate: 0,
        source_warehouse: item.item_defaults[0].default_warehouse,
        target_warehouse: '',
      });
    } else {
      itemDataSource.push({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: 1,
        rate: 0,
        source_warehouse: item.item_defaults[0].default_warehouse,
        target_warehouse: '',
        serial_no: item.serial_no,
      });
    }
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(itemDataSource);
    this.addItem();
  }

  updateItem(row: Item, index: number, item: Item) {
    if (item == null) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    Object.assign(row, item);
    row.source_warehouse = item.source_warehouse;
    row.qty = 1;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(itemDataSource);
    this.itemsControl.controls[index].setValue(item);
  }

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_code = '';
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.minimumPrice = 0;
    item.serial_no = '';
    item.source_warehouse = '';
    item.target_warehouse = '';
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    row.qty = quantity;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(itemDataSource);
  }

  updateRate(row: Item, rate: number) {
    if (rate == null) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    if (row.minimumPrice && row.minimumPrice > rate) {
      row.rate = row.minimumPrice;
    } else {
      row.rate = rate;
    }
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(itemDataSource);
  }

  calculateTotal(itemList: Item[]) {
    let sum = 0;
    itemList.forEach(item => {
      sum += item.qty * item.rate;
    });
    this.stockEntryForm.controls.total.setValue(sum);
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.itemsControl.removeAt(i);
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(this.dataSource.data());
  }

  updateSWarehouse(row: Item, index: number, source_warehouse: string) {
    if (!source_warehouse) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    row.source_warehouse = source_warehouse;
    this.dataSource.update(itemDataSource);
  }
  updateTWarehouse(row: Item, index: number, target_warehouse: string) {
    if (!target_warehouse) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    row.target_warehouse = target_warehouse;
    this.dataSource.update(itemDataSource);
  }
}
