import { Component, Input, Optional, Host } from '@angular/core';
import { SatPopover } from '@ncstate/sat-popover';
import { filter, startWith, map } from 'rxjs/operators';
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
    this.itemFormControl.setValue(x);
    this.quantity = x;
    this._value = x;
  }

  @Input()
  column: string;

  private _value = '';

  itemFormControl = new FormControl();
  itemList: Array<Item>;
  filteredItemList: Observable<Item[]>;
  /** Form model for the input. */
  comment = '';
  quantity: number = null;
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
    this.salesService.getItemList().subscribe({
      next: response => {
        this.itemList = [];
        this.itemList = response;
      },
    });
    this.filteredItemList = this.itemFormControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value)),
    );
  }

  private _filter(value: string): Item[] {
    const filterValue = value.toLowerCase();

    return this.itemList.filter(
      option => option.name.toLowerCase().indexOf(filterValue) === 0,
    );
  }

  onSubmit() {
    if (this.popover) {
      // console.log(this.itemFormControl.value);
      if (this.column === 'item') {
        const selectedItem = this._filter(this.itemFormControl.value);
        this.popover.close(selectedItem[0]);
      } else this.popover.close(this.quantity);
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
