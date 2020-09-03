import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import { ItemsDataSource } from '../items-datasource';
import {
  WarrantyClaimsDetails,
  StockEntryDetails,
  StockEntryItems,
} from '../../../../common/interfaces/warranty.interface';
import { ActivatedRoute, Router } from '@angular/router';
import {
  STOCK_ENTRY_STATUS,
  DURATION,
  MATERIAL_ISSUE,
  MATERIAL_RECEIPT,
} from '../../../../constants/app-string';
import { AddServiceInvoiceService } from '../../service-invoices/add-service-invoice/add-service-invoice.service';
import { DEFAULT_COMPANY } from '../../../../constants/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DUPLICATE_SERIAL,
  STOCK_ENTRY_CREATED,
  STOCK_ENTRY_CREATE_FAILURE,
  ITEM_NOT_FOUND,
} from '../../../../constants/messages';

@Component({
  selector: 'app-add-stock-entry',
  templateUrl: './add-stock-entry.page.html',
  styleUrls: ['./add-stock-entry.page.scss'],
})
export class AddStockEntryPage implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  company: string;
  dataSource: ItemsDataSource;
  stockEntryForm: FormGroup;
  type: Array<any> = [];
  itemsControl: FormArray;
  serialActive: boolean;
  button_active: boolean;
  serialItem: any;
  displayedColumns: string[] = [
    'item_name',
    'serial_no',
    'source_warehouse',
    'quantity',
    'delete',
  ];

  get formControl() {
    return this.stockEntryForm.controls;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
    private readonly addServiceInvoiceService: AddServiceInvoiceService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly snackbar: MatSnackBar,
  ) {}

  async ngOnInit() {
    this.serialActive = false;
    this.type = Object.keys(STOCK_ENTRY_STATUS).map(
      key => STOCK_ENTRY_STATUS[key],
    );
    this.dataSource = new ItemsDataSource();
    this.createFormGroup();
    this.setDateTime(new Date());
    this.checkActive(this.dataSource.data().length);

    this.company = await this.addServiceInvoiceService
      .getStore()
      .getItem(DEFAULT_COMPANY);
    this.getWarrantyDetail();
  }

  getWarrantyDetail() {
    this.addServiceInvoiceService
      .getWarrantyDetail(this.activatedRoute.snapshot.params.uuid)
      .subscribe({
        next: res => {
          this.warrantyObject = res;
        },
      });
  }

  navigateBack() {
    this.location.back();
  }

  submitDraft() {
    if (this.dataSource.data()[0].has_serial_no) {
      this.mapSerialStockEntry();
    } else {
      this.mapNonSerialEntry();
    }
  }

  mapSerialStockEntry() {
    let selectedItem = {} as StockEntryDetails;
    this.addServiceInvoiceService
      .getSerialItemFromRMAServer(this.dataSource.data()[0].serial_no[0])
      .subscribe({
        next: (res: any) => {
          selectedItem = this.mapStockData(res);
          selectedItem.items = [this.dataSource.data()[0]];
          selectedItem.stock_entry_type = MATERIAL_RECEIPT;
          this.createReturnDeliveryNote(selectedItem);
        },
        error: err => {},
      });
  }

  mapNonSerialEntry() {
    let selectedItem = {} as StockEntryDetails;
    for (let index = 0; index < this.dataSource.data().length; index++) {
      this.addServiceInvoiceService
        .getItemFromRMAServer(this.dataSource.data()[0].item_code)
        .subscribe({
          next: (res: any) => {
            selectedItem = this.mapStockData(res);
            selectedItem.items = [this.dataSource.data()[index]];
            switch (index) {
              case 0:
                selectedItem.stock_entry_type = MATERIAL_RECEIPT;
                this.createStockEntry(selectedItem);
                break;
              case 1:
                selectedItem.stock_entry_type = MATERIAL_ISSUE;
                this.createStockEntry(selectedItem);
                break;
              default:
                break;
            }
          },
          error: err => {},
        });
    }
  }

  mapStockData(res) {
    const selectedItem = {} as StockEntryDetails;
    selectedItem.customer = res?.customer;
    selectedItem.salesWarrantyDate = res?.warranty?.salesWarrantyDate;
    selectedItem.delivery_note = res?.delivery_note;
    selectedItem.sales_invoice_name = res?.sales_invoice_name;
    selectedItem.company = this.company;
    selectedItem.warrantyClaimUuid = this.warrantyObject.uuid;
    selectedItem.posting_date = this.stockEntryForm.controls.date.value;
    selectedItem.type = this.stockEntryForm.controls.type.value;
    selectedItem.description = this.stockEntryForm.controls.description.value;
    return selectedItem;
  }

  createStockEntry(selectedItem: StockEntryDetails) {
    this.addServiceInvoiceService.createStockEntry(selectedItem).subscribe({
      next: res => {
        this.snackbar.open(STOCK_ENTRY_CREATED, 'Close', {
          duration: DURATION,
        });
        this.router.navigate([
          '/warranty/view-warranty-claims',
          this.activatedRoute.snapshot.params.uuid,
        ]);
      },
      error: ({ message }) => {
        if (!message) message = STOCK_ENTRY_CREATE_FAILURE;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  createReturnDeliveryNote(selectedItem) {
    this.addServiceInvoiceService.createStockReturn(selectedItem).subscribe({
      next: res => {
        selectedItem.stock_entry_type = MATERIAL_ISSUE;
        this.createStockEntry(selectedItem);
        this.snackbar.open(STOCK_ENTRY_CREATED, 'Close', {
          duration: DURATION,
        });
        this.router.navigate([
          '/warranty/view-warranty-claims',
          this.activatedRoute.snapshot.params.uuid,
        ]);
      },
      error: ({ message }) => {
        if (!message) message = STOCK_ENTRY_CREATE_FAILURE;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  createFormGroup() {
    this.stockEntryForm = new FormGroup({
      type: new FormControl('', [Validators.required]),
      date: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      items: new FormArray([]),
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

  setStockEntryType(type) {
    this.trimRow();
    if (type === STOCK_ENTRY_STATUS.REPLACE) {
      this.button_active = true;
      this.addServiceInvoiceService
        .getItemFromRMAServer(this.warrantyObject.item_code)
        .subscribe({
          next: serialItem => {
            this.serialItem = serialItem;
            if (serialItem.has_serial_no) {
              this.addServiceInvoiceService
                .getSerial(this.warrantyObject.serial_no)
                .subscribe({
                  next: item => {
                    this.AddSerialItem(item);
                    this.addReplaceItem(item);
                  },
                  error: err => {
                    this.snackbar.open(`Serial ${ITEM_NOT_FOUND}`, 'Close', {
                      duration: DURATION,
                    });
                  },
                });
            } else {
              this.AddNonSerialItem(serialItem);
              this.addReplaceItem(serialItem);
            }
          },
          error: err => {
            this.snackbar.open(ITEM_NOT_FOUND, 'Close', { duration: DURATION });
          },
        });
    } else {
      this.checkActive(this.dataSource.data().length);
    }
  }

  trimRow() {
    for (let index = 0; index <= this.dataSource.data().length; index++) {
      this.dataSource.data().splice(0, 1);
      this.itemsControl.removeAt(0);
      this.dataSource.update(this.dataSource.data());
    }
  }

  AddNonSerialItem(serialItem: any) {
    this.serialActive = false;
    const itemDataSource = this.dataSource.data();
    itemDataSource.push({
      has_serial_no: 0,
      item_code: serialItem.item_code,
      item_name: serialItem.item_name,
      qty: 1,
      rate: 0,
      serial_no: [''],
    });
    this.dataSource.update(itemDataSource);
  }

  AddSerialItem(serialItem: any) {
    this.serialActive = true;
    const itemDataSource = this.dataSource.data();
    itemDataSource.push({
      has_serial_no: 1,
      item_code: serialItem.item_code,
      item_name: serialItem.item_name,
      qty: -1,
      rate: 0,
      s_warehouse: serialItem.warehouse,
      t_warehouse: serialItem.warehouse,
      serial_no: [serialItem.serial_no],
    });
    this.dataSource.update(itemDataSource);
  }

  updateItem(row: StockEntryItems, index: number, item: StockEntryItems) {
    if (item == null) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    Object.assign(row, item);
    row.s_warehouse = item.s_warehouse;
    row.t_warehouse = item.t_warehouse;
    row.qty = 1;
    if (item.has_serial_no) {
      this.serialActive = true;
    } else {
      this.serialActive = false;
    }
    this.dataSource.update(itemDataSource);
    this.itemsControl.controls[index].setValue(item);
  }

  addItem() {
    this.serialActive = false;
    const data = this.dataSource.data();
    const item = {} as StockEntryItems;
    item.item_code = '';
    item.item_name = '';
    item.qty = 0;
    item.minimumPrice = 0;
    item.serial_no = [];
    item.s_warehouse = '';
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
    this.checkActive(this.dataSource.data().length);
  }

  addReplaceItem(row) {
    this.serialActive = false;
    const data = this.dataSource.data();
    const item = {} as StockEntryItems;
    item.item_code = row.item_code;
    item.item_name = row.item_name;
    item.qty = 1;
    item.minimumPrice = 0;
    item.serial_no = [];
    item.s_warehouse = '';
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
    this.checkActive(this.dataSource.data().length);
  }

  updateQuantity(row: StockEntryItems, quantity: number) {
    if (quantity == null) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    row.qty = quantity;
    this.dataSource.update(itemDataSource);
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.itemsControl.removeAt(i);
    this.dataSource.update(this.dataSource.data());
    this.checkActive(this.dataSource.data().length);
  }

  updateSWarehouse(row: StockEntryItems, source_warehouse: string) {
    if (!source_warehouse) {
      return;
    }
    const itemDataSource = this.dataSource.data().slice();
    row.s_warehouse = source_warehouse;
    row.t_warehouse = source_warehouse;
    this.dataSource.update(itemDataSource);
  }

  updateSerial(row: StockEntryItems, serial_no: any) {
    if (!serial_no) {
      return;
    }
    if (this.checkDuplicateSerial(serial_no)) {
      const itemDataSource = this.dataSource.data().slice();
      row.serial_no[0] = serial_no.serial_no[0];
      row.item_name = serial_no.item_name;
      row.s_warehouse = serial_no.source_warehouse;
      row.t_warehouse = serial_no.source_warehouse;
      row.qty = serial_no.qty;
      row.item_code = serial_no.item_code;
      this.dataSource.update(itemDataSource);
    }
  }

  checkDuplicateSerial(serial) {
    let result: boolean = true;
    for (const iterator of this.dataSource.data()) {
      if (iterator?.serial_no[0] === serial?.serial_no[0]) {
        this.snackbar.open(DUPLICATE_SERIAL, 'Close', { duration: DURATION });
        result = false;
        break;
      }
    }
    return result;
  }

  checkActive(length: number) {
    if (length >= 2) {
      this.button_active = true;
    } else {
      this.button_active = false;
    }
  }
}
