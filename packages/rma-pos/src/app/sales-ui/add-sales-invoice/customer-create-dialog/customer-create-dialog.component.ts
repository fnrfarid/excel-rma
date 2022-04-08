import { Component, Inject, OnInit } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DialogData } from '../../../common/interfaces/sales.interface';
import { Observable, of } from 'rxjs';
import {
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

import {
  FormControl,
  FormGroup
} from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import {
  TERRITORY
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
    customerGroup:0
  };
  validateInput: any = ValidateInputSelected;

  customerGroupList: any;
  copyCustomerGroupList: any;



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
    this.salesService.customerGroupList().subscribe((data) =>{
      this.customerGroupList = data
      
    });

    // fetches the territory list and populates inside the customer modal

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
    //fetches the customer group list data

    this.salesService.customerGroupList().subscribe((data) =>{
      this.customerGroupList = data
    });

    //search function that searches from a duplicate list and renders the results

    this.salesCustomerDialogForm.get('customerGroup').valueChanges.subscribe(newValue=>{
      this.salesService.customerGroupList().subscribe((data) =>{
        this.copyCustomerGroupList = data
        this.customerGroupList = this.filterValues(newValue);

      });
    })

  }
  //customer creation form 

  createFormGroup(){
    this.salesCustomerDialogForm = new FormGroup({
      series: new FormControl(''),
      fullName : new FormControl(''),
      type : new FormControl(''),
      customerGroup: new FormControl(''),
      territory: new FormControl(''),
      emailId : new FormControl(''),
      mobileNo : new FormControl(''),
      address : new FormControl(''),
      city : new FormControl('')
    })
  }

  //filters the value from the customer group and retrurns the value
  
  filterValues(name){
    if(this.copyCustomerGroupList){
      return this.copyCustomerGroupList.filter(value=>
        value.name.toLowerCase().indexOf(name.toLowerCase()) !== -1);
    }

  }

}
