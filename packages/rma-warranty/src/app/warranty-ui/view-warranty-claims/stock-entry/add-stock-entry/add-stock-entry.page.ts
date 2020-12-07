import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import { ItemsDataSource } from '../items-datasource';
import {
  WarrantyClaimsDetails,
  StockEntryDetails,
  StockEntryItems,
  WarrantyItem,
} from '../../../../common/interfaces/warranty.interface';
import { ActivatedRoute, Router } from '@angular/router';
import {
  STOCK_ENTRY_ITEM_TYPE,
  STOCK_ENTRY_STATUS,
  DURATION,
} from '../../../../constants/app-string';
import { AddServiceInvoiceService } from '../../service-invoices/add-service-invoice/add-service-invoice.service';
import { DEFAULT_COMPANY } from '../../../../constants/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  STOCK_ENTRY_CREATED,
  ITEM_NOT_FOUND,
  STOCK_ENTRY_CREATE_FAILURE,
} from '../../../../constants/messages';
import { LoadingController } from '@ionic/angular';
import { mergeMap, switchMap, toArray } from 'rxjs/operators';
import { from } from 'rxjs';

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
  button_active: boolean;
  serialItem: any;
  displayedColumns: string[] = [
    'stock_entry_type',
    'item_name',
    'serial_no',
    'source_warehouse',
    'quantity',
    'delete',
  ];
  stockEntryType: Array<string> = Object.values(STOCK_ENTRY_ITEM_TYPE);

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
    private loadingController: LoadingController,
  ) {}

  async ngOnInit() {
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

  async submitDraft() {
    const loading = await this.loadingController.create({
      message: 'fetching data...!',
    });
    await loading.present();
    from(this.dataSource.data())
      .pipe(
        mergeMap(item => {
          if (item.stock_entry_type === STOCK_ENTRY_ITEM_TYPE.RETURNED) {
            loading.message = 'making stock entry...!';
            item.qty = -item.qty;
            return this.createReturnDeliveryNotes(item);
          }
          if (item.stock_entry_type === STOCK_ENTRY_ITEM_TYPE.DELIVERED) {
            loading.message = 'making stock entry...!';
            return this.createReturnDeliveryNotes(item);
          }
        }),
        toArray(),
      )
      .subscribe({
        next: success => {
          loading.dismiss();
          this.snackbar.open(STOCK_ENTRY_CREATED, 'Close', {
            duration: DURATION,
          });
          this.router.navigate([
            '/warranty/view-warranty-claims',
            this.activatedRoute.snapshot.params.uuid,
          ]);
        },
        error: err => {
          loading.dismiss();
          this.snackbar.open(STOCK_ENTRY_CREATE_FAILURE, 'Close', {
            duration: DURATION,
          });
        },
      });
  }

  createReturnDeliveryNotes(item) {
    let selectedItem = {} as StockEntryDetails;
    selectedItem.items = [];

    if (item.has_serial_no) {
      return this.addServiceInvoiceService
        .getSerialItemFromRMAServer(item.serial_no)
        .pipe(
          switchMap(res => {
            selectedItem = this.mapStockData(res, item);
            selectedItem.items = [item];
            return this.addServiceInvoiceService.createStockEntry(selectedItem);
          }),
        );
    } else {
      return this.addServiceInvoiceService
        .getItemFromRMAServer(item.item_code)
        .pipe(
          switchMap(res => {
            selectedItem = this.mapStockData(res, item);
            selectedItem.items = [item];
            return this.addServiceInvoiceService.createStockEntry(selectedItem);
          }),
        );
    }
  }

  mapStockData(res, item) {
    const selectedItem = {} as StockEntryDetails;
    selectedItem.replacedSerial = item.replacedSerial;
    selectedItem.set_warehouse = item.s_warehouse;
    selectedItem.customer = this.warrantyObject.customer;
    selectedItem.salesWarrantyDate = res?.warranty?.salesWarrantyDate;
    selectedItem.delivery_note = res?.delivery_note;
    selectedItem.sales_invoice_name = res?.sales_invoice_name;
    selectedItem.company = this.company;
    selectedItem.warrantyClaimUuid = this.warrantyObject.uuid;
    selectedItem.posting_date = this.stockEntryForm.controls.date.value;
    selectedItem.type = this.stockEntryForm.controls.type.value;
    selectedItem.stock_entry_type = item.stock_entry_type;
    selectedItem.description = this.stockEntryForm.controls.description.value;
    if (item.stock_entry_type === STOCK_ENTRY_ITEM_TYPE.RETURNED) {
      selectedItem.is_return = 1;
    }
    return selectedItem;
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
    if (
      type === STOCK_ENTRY_STATUS.REPLACE ||
      type === STOCK_ENTRY_STATUS.UPGRADE
    ) {
      this.button_active = true;
      this.addServiceInvoiceService
        .getItemFromRMAServer(this.warrantyObject.item_code)
        .subscribe({
          next: (serialItem: WarrantyItem) => {
            this.serialItem = serialItem;
            if (serialItem.has_serial_no) {
              this.addServiceInvoiceService
                .getSerialItemFromRMAServer(this.warrantyObject.serial_no)
                .subscribe({
                  next: (item: WarrantyItem) => {
                    this.AddItem({
                      ...item,
                      qty: 1,
                      has_serial_no: 1,
                      s_warehouse: item.warehouse,
                      stock_entry_type: STOCK_ENTRY_ITEM_TYPE.RETURNED,
                    });
                    this.AddItem({
                      ...item,
                      qty: 1,
                      has_serial_no: 1,
                      serial_no: undefined,
                      stock_entry_type: STOCK_ENTRY_ITEM_TYPE.DELIVERED,
                    });
                  },
                  error: err => {
                    this.snackbar.open(`Serial ${ITEM_NOT_FOUND}`, 'Close', {
                      duration: DURATION,
                    });
                  },
                });
            } else {
              this.AddItem({
                ...serialItem,
                qty: 1,
                has_serial_no: 0,
                stock_entry_type: STOCK_ENTRY_ITEM_TYPE.RETURNED,
              });
              this.AddItem({
                ...serialItem,
                qty: 1,
                has_serial_no: 0,
                stock_entry_type: STOCK_ENTRY_ITEM_TYPE.DELIVERED,
              });
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

  AddItem(serialItem?: WarrantyItem) {
    const itemDataSource = this.dataSource.data();
    itemDataSource.push({
      ...serialItem,
      serial_no: serialItem.has_serial_no
        ? serialItem.serial_no
        : 'Non serial Item',
    });
    this.dataSource.update(itemDataSource);
  }

  updateItem(index: number, updatedItem: StockEntryItems) {
    const existingItem = this.dataSource.data()[index];
    Object.assign(existingItem, updatedItem);
    this.dataSource.data()[index] = existingItem;
    this.dataSource.update(this.dataSource.data());
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.itemsControl.removeAt(i);
    this.dataSource.update(this.dataSource.data());
    this.checkActive(this.dataSource.data().length);
  }

  updateSerial(index: number, serialObject: any) {
    if (!serialObject.serial_no) {
      return;
    }
    if (this.checkDuplicateSerial()) {
      if (
        this.stockEntryForm.controls.type.value === STOCK_ENTRY_STATUS.REPLACE
      ) {
        if (
          this.dataSource.data()[index].stock_entry_type ===
          STOCK_ENTRY_ITEM_TYPE.DELIVERED
        ) {
          this.dataSource.data()[
            this.dataSource
              .data()
              .findIndex(
                serialData =>
                  serialData.stock_entry_type ===
                  STOCK_ENTRY_ITEM_TYPE.RETURNED,
              )
          ].replacedSerial = serialObject.serial_no;
        }
      }
      this.updateItem(index, serialObject);
    }
  }

  checkDuplicateSerial() {
    const state = { existingSerials: [], setSerials: new Set() };
    this.dataSource.data().forEach(item => {
      state.existingSerials.push(item.serial_no);
      state.setSerials.add(item.serial_no);
    });
    return state.existingSerials.length === Array.from(state.setSerials).length
      ? true
      : false;
  }

  checkActive(length: number) {
    if (length >= 2) {
      this.button_active = true;
    } else {
      this.button_active = false;
    }
  }
}
