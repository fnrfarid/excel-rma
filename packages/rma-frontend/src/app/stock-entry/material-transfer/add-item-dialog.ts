import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ValidateInputSelected } from 'src/app/common/pipes/validators';
import { SalesService } from 'src/app/sales-ui/services/sales.service';

@Component({
  selector: 'add-item-dialog',
  templateUrl: 'add-item-dialog.html',
})
export class AddItemDialog {
  filteredItemList: Observable<any[]>;
  itemFormControl = new FormControl();
  validateInput: any = ValidateInputSelected;

  constructor(
    public dialogRef: MatDialogRef<AddItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private salesService: SalesService,
  ) {
    this.getItemList();
  }

  onNoClick(): void {
    this.dialogRef.close(this.itemFormControl.value);
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
    return option && option.item_name ? option.item_name : '';
  }
}
