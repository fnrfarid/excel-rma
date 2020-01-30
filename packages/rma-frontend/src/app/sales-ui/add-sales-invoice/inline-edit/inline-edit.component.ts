import { Component, Input, Optional, Host } from '@angular/core';
import { SatPopover } from '@ncstate/sat-popover';
import { filter, switchMap, startWith, map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Item } from '../../../common/interfaces/sales.interface';
import { SalesService } from '../../services/sales.service';
import { Observable } from 'rxjs';

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
    this.rate = x;
    this._value = x;
  }

  @Input()
  column: string;

  private _value = '';

  itemFormControl = new FormControl();
  itemList: Array<Item>;
  filteredItemList: Observable<any[]>;
  /** Form model for the input. */
  comment = '';
  quantity: number = null;
  rate: number = null;

  constructor(
    @Optional() @Host() public popover: SatPopover,
    private salesService: SalesService,
  ) {}

  ngOnInit() {
    // subscribe to cancellations and reset form value
    if (this.popover) {
      this.popover.closed
        .pipe(filter(val => val == null))
        .subscribe(() => (this.comment = this.value || null));
    }
    this.getItemList();
  }

  getItemList() {
    this.filteredItemList = this.itemFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getItemList(value);
      }),
    );
  }

  getOptionText(option) {
    return option.item_name;
  }

  onSubmit() {
    if (this.popover) {
      if (this.column === 'item') {
        this.salesService
          .getItemPrice(this.itemFormControl.value.item_code)
          .pipe(
            switchMap(priceListArray => {
              return this.salesService
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
              selectedItem.name = this.itemFormControl.value.name;
              selectedItem.owner = this.itemFormControl.value.owner;
              selectedItem.rate =
                res.priceListArray.length === 0
                  ? 0
                  : res.priceListArray[0].price_list_rate;
              this.popover.close(selectedItem);
            },
          });
      } else if (this.column === 'quantity') this.popover.close(this.quantity);
      else this.popover.close(this.rate);
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
