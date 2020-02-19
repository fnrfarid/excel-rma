import { Component, OnInit, Input, Optional, Host } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SatPopover } from '@ncstate/sat-popover';

@Component({
  selector: 'edit-date',
  templateUrl: './edit-date.component.html',
  styleUrls: ['./edit-date.component.scss'],
})
export class EditDateComponent implements OnInit {
  @Input()
  get value(): any {
    return this._value;
  }
  set value(val) {
    this.frmCtrl.setValue({ minimumPrice: val });
    this.days = val;
    this._value = val;
  }
  private _value = '';
  days: number = 0.0;

  frmCtrl = new FormControl();

  @Input()
  column: string;

  constructor(@Optional() @Host() public popover: SatPopover) {}

  ngOnInit() {}

  onSubmit() {
    if (this.popover) {
      this.popover.close(this.days);
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
