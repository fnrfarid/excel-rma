import { Component, Input, Optional, Host } from '@angular/core';
import { SatPopover } from '@ncstate/sat-popover';
import { filter, switchMap, startWith } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
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

  itemList: Array<Item>;
  filteredItemList: Observable<any[]>;
  /** Form model for the input. */
  comment = '';
  quantity: number = null;

  constructor(
    @Optional() @Host() public popover: SatPopover,
    private salesService: SalesService,
  ) {}

  ngOnInit() {
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
          .subscribe({
            next: res => {
              const selectedItem = {} as Item;
              selectedItem.item_code = this.itemFormControl.value.item_code;
              selectedItem.item_name = this.itemFormControl.value.item_name;
              selectedItem.name = this.itemFormControl.value.name;
              selectedItem.owner = this.itemFormControl.value.owner;
              selectedItem.rate = 0;
              if (res.length > 0) {
                selectedItem.minimumPrice = res[0].price_list_rate;
                selectedItem.rate = res[0].price_list_rate;
              }
              this.popover.close(selectedItem);
            },
          });
      } else if (this.column === 'quantity') this.popover.close(this.quantity);
      else {
        if (this.rateFormControl.value < this.minimumPrice) {
          this.rateFormControl.setErrors({ min: false });
        } else this.popover.close(this.rateFormControl.value);
      }
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
