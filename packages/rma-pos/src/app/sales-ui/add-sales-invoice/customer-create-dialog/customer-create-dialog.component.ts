import { Component, Inject, OnInit } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DialogData } from '../../../common/interfaces/sales.interface';
import { Observable, throwError, of, from, forkJoin, Subject } from 'rxjs';
import {
  startWith,
  switchMap,
  filter,
  map,
  mergeMap,
  toArray,
  concatMap,
} from 'rxjs/operators';

import {
  FormControl,
  FormGroup,
} from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import {
  DRAFT,
  CLOSE,
  DURATION,
  UPDATE_ERROR,
  SHORT_DURATION,
  TERRITORY,
  WAREHOUSES,
  DELIVERY_NOTE,
  DELIVERED_SERIALS_BY,
} from '../../../constants/app-string';

import { ValidateInputSelected } from '../../../common/pipes/validators';


@Component({
  selector: 'app-customer-create-dialog',
  templateUrl: './customer-create-dialog.component.html',
  styleUrls: ['./customer-create-dialog.component.scss'],
})
export class CustomerCreateDialogComponent implements OnInit {
  salesCustomerDialogForm: FormGroup;
  territoryList: Observable<any[]>;
  initial: { [key: string]: number } = {
    warehouse: 0,
    territory: 0,
  };
  validateInput: any = ValidateInputSelected;



  get f() {
    return this.salesCustomerDialogForm.controls;
  }

  constructor(
    public dialogRef: MatDialogRef<CustomerCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private salesService: SalesService,

  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.createFormGroup();
    this.territoryList = this.salesCustomerDialogForm
    .get('territory')
    .valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getStore().getItemAsync(TERRITORY, value);
      }),
      switchMap(data => {
        if (data && data.length) {
          this.initial.territory
            ? null
            : (this.salesCustomerDialogForm
                .get('territory')
                .setValue(data[0]),
              this.initial.territory++);
          return of(data);
        }
        return of([]);
      }),
    );
  }

  createFormGroup(){
    this.salesCustomerDialogForm = new FormGroup({
      series: new FormControl(''),
      fullName : new FormControl(''),
      type : new FormControl(''),
      customerGroup: new FormControl(''),
      territory: new FormControl(''),
      excelFixedCreditLimit : new FormControl(''),
      emailId : new FormControl(''),
      mobileNo : new FormControl(''),
      addressLine1 : new FormControl(''),
      addressLine2: new FormControl(''),
      zipCode : new FormControl(''),
      city : new FormControl(''),
      state: new FormControl(''),
      country: new FormControl('')
    })
  }

}
