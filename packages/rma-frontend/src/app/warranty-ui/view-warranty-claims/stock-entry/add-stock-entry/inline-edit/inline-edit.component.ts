import { Component, Input, Optional, Host } from '@angular/core';
import { SatPopover } from '@ncstate/sat-popover';
import { filter, switchMap, startWith, map } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { Item } from '../../../../../common/interfaces/sales.interface';
import { Observable } from 'rxjs';
import { AddServiceInvoiceService } from '../../../service-invoices/add-service-invoice/add-service-invoice.service';
import { ITEM_COLUMN } from '../../../../../constants/app-string';

@Component({
  selector: 'inline-edit',
  templateUrl: './inline-edit.component.html',
  styleUrls: ['inline-edit.component.scss'],
})
export class InlineEditComponent {
  /** Overrides the comment and provides a reset value when changes are cancelled. */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(x) {
    this.itemFormControl.setValue({ item_name: x });
    this.quantity = x;
    this.warehouse = x;
    this.warehouseFormControl.setValue({ name: x });
    this.serialFormControl.setValue(x);
    this.rateFormControl.setValue(x);
    this._value = x;
  }

  @Input()
  column: string;

  @Input()
  minimumPrice: number;

  private _value = '';

  itemFormControl = new FormControl();
  rateFormControl = new FormControl('', [Validators.min(this.minimumPrice)]);
  warehouseFormControl = new FormControl();
  serialFormControl = new FormControl();

  itemList: Array<Item>;
  filteredItemList: Observable<any[]>;

  warehouseList: Observable<any[]>;
  /** Form model for the input. */
  comment = '';
  quantity: number = null;
  warehouse: any = '';

  constructor(
    @Optional() @Host() public popover: SatPopover,
    private addServiceInvoiceService: AddServiceInvoiceService,
  ) {}

  ngOnInit() {
    if (this.popover) {
      this.popover.closed
        .pipe(filter(val => val == null))
        .subscribe(() => (this.comment = this.value || null));
    }
    this.getItemList();
    this.getWarehouseList();
  }

  getItemList() {
    this.filteredItemList = this.itemFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.addServiceInvoiceService.getItemList(value);
      }),
    );
  }

  getOptionText(option) {
    return option.item_name;
  }

  getWarehouseOptionText(option) {
    if (option) return option.name;
  }

  selectedState(option) {}

  getWarehouseList() {
    this.warehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.addServiceInvoiceService.getWarehouseList(value);
      }),
      map(res => res.docs),
    );
  }

  onSubmit() {
    if (this.popover) {
      switch (this.column) {
        case ITEM_COLUMN.ITEM:
          this.addServiceInvoiceService
            .getItemPrice(this.itemFormControl.value.item_code)
            .pipe(
              switchMap(priceListArray => {
                return this.addServiceInvoiceService
                  .getItemFromRMAServer(this.itemFormControl.value.item_code)
                  .pipe(
                    map(item => {
                      return {
                        priceListArray,
                        item,
                      };
                    }),
                  );
              }),
            )
            .subscribe({
              next: res => {
                const selectedItem = {} as Item;
                selectedItem.uuid = res.item.uuid;
                selectedItem.minimumPrice = res.item.minimumPrice;
                selectedItem.item_code = this.itemFormControl.value.item_code;
                selectedItem.item_name = this.itemFormControl.value.item_name;
                selectedItem.item_group = this.itemFormControl.value.item_group;
                selectedItem.source_warehouse =
                  res.item.item_defaults[0].default_warehouse;
                selectedItem.name = this.itemFormControl.value.name;
                selectedItem.owner = this.itemFormControl.value.owner;
                selectedItem.rate = 0;
                selectedItem.has_serial_no = res.item.has_serial_no;
                if (res.priceListArray.length > 0) {
                  selectedItem.rate = res.priceListArray[0].price_list_rate;
                }
                this.popover.close(selectedItem);
              },
            });
          break;

        case ITEM_COLUMN.QUANTITY:
          this.popover.close(this.quantity);
          break;

        case ITEM_COLUMN.WAREHOUSE:
          this.popover.close(this.warehouseFormControl.value.name);
          break;

        default:
          if (this.rateFormControl.value < this.minimumPrice) {
            this.rateFormControl.setErrors({ min: false });
          } else this.popover.close(this.rateFormControl.value);
          break;
      }
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
