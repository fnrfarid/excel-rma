import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TimeService } from '../../api/time/time.service';
import { AddWarrantyService } from './add-warranty.service';
import { startWith, switchMap, map, debounceTime } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';
import {
  WarrantyState,
  SerialNoDetails,
  Item,
} from '../../common/interfaces/warranty.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UPDATE_ERROR, DURATION } from './../../constants/app-string';
@Component({
  selector: 'app-add-warranty-claim',
  templateUrl: './add-warranty-claim.page.html',
  styleUrls: ['./add-warranty-claim.page.scss'],
})
export class AddWarrantyClaimPage implements OnInit {
  warrantyClaimForm: FormGroup;
  address = {} as any;
  filteredCustomerList: any;
  claimList: any;
  getSerialData: SerialNoDetails;
  warrantyState: WarrantyState;
  productList: any;
  territoryList: any;

  constructor(
    private location: Location,
    private readonly time: TimeService,
    private readonly warrantyService: AddWarrantyService,
    private readonly loadingController: LoadingController,
    private readonly snackbar: MatSnackBar,
  ) {}

  async ngOnInit() {
    this.claimList = [
      'Warranty / Non Warranty',
      'Non Serial Warranty',
      'Third Party Warranty',
    ];
    this.warrantyState = {
      serial_no: { disabled: false, active: true },
      invoice_no: { disabled: false, active: true },
      warranty_end_date: { disabled: false, active: true },
      customer_contact: { disabled: true, active: true },
      customer_address: { disabled: true, active: true },
      product_name: { disabled: true, active: true },
      customer_name: { disabled: true, active: true },
      product_brand: { disabled: true, active: true },
    };
    this.createForm();
    this.warrantyClaimForm.controls.received_on.setValue(
      await this.getDateTime(new Date()),
    );
    this.warrantyClaimForm.controls.delivery_date.setValue(
      await this.getDeliveryDate(new Date()),
    );

    this.filteredCustomerList = this.warrantyClaimForm.controls.customer_name.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.warrantyService.getCustomerList(value);
      }),
      map(res => res.docs),
    );

    this.productList = this.warrantyClaimForm.controls.product_name.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.warrantyService.getItemList(value);
      }),
      map(res => res.docs),
    );

    this.territoryList = this.warrantyClaimForm.controls.receiving_branch.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.warrantyService.getTerritoryList(value);
      }),
      map(res => res.docs),
    );
  }

  getFormState(state) {
    switch (state) {
      case 'Non Serial Warranty':
        this.warrantyState = {
          serial_no: { disabled: true, active: false },
          invoice_no: { disabled: true, active: false },
          warranty_end_date: { disabled: true, active: false },
          customer_contact: { disabled: false, active: true },
          customer_address: { disabled: false, active: true },
          product_name: { disabled: true, active: true },
          customer_name: { disabled: true, active: true },
          product_brand: { disabled: false, active: true },
        };
        this.isDisabled();
        break;

      case 'Third Party Warranty':
        this.warrantyState = {
          serial_no: { disabled: true, active: true },
          invoice_no: { disabled: false, active: false },
          warranty_end_date: { disabled: true, active: false },
          customer_contact: { disabled: true, active: true },
          customer_address: { disabled: true, active: true },
          product_name: { disabled: true, active: true },
          customer_name: { disabled: true, active: true },
          product_brand: { disabled: true, active: true },
        };
        this.isDisabled();
        break;

      default:
        this.warrantyState = {
          serial_no: { disabled: true, active: true },
          invoice_no: { disabled: false, active: true },
          warranty_end_date: { disabled: false, active: true },
          customer_contact: { disabled: false, active: true },
          customer_address: { disabled: false, active: true },
          product_name: { disabled: false, active: true },
          customer_name: { disabled: false, active: true },
          product_brand: { disabled: false, active: true },
        };
        this.isDisabled();
        break;
    }
  }

  isDisabled() {
    Object.keys(this.warrantyState).forEach(key => {
      this.warrantyState[key].disabled
        ? this.warrantyClaimForm.controls[key].enable()
        : this.warrantyClaimForm.controls[key].disable();
    });
  }

  async getDateTime(date: Date) {
    const DateTime = await this.time.getDateAndTime(date);
    return DateTime.date;
  }

  async getDeliveryDate(date: Date) {
    date.setDate(date.getDate() + 3);
    return this.getDateTime(date);
  }

  get f() {
    return this.warrantyClaimForm.controls;
  }

  navigateBack() {
    this.location.back();
  }

  submitDraft() {}

  createForm() {
    this.warrantyClaimForm = new FormGroup({
      warranty_end_date: new FormControl('', [Validators.required]),
      claim_type: new FormControl('', [Validators.required]),
      received_on: new FormControl('', [Validators.required]),
      delivery_date: new FormControl('', [Validators.required]),
      receiving_branch: new FormControl('', [Validators.required]),
      delivery_branch: new FormControl('', [Validators.required]),
      product_brand: new FormControl('', [Validators.required]),
      problem: new FormControl('', [Validators.required]),
      problem_details: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [Validators.required]),
      customer_contact: new FormControl('', [Validators.required]),
      customer_address: new FormControl('', [Validators.required]),
      third_party_name: new FormControl('', [Validators.required]),
      third_party_contact: new FormControl('', [Validators.required]),
      third_party_address: new FormControl('', [Validators.required]),
      product_name: new FormControl('', [Validators.required]),
      customer_name: new FormControl('', [Validators.required]),
      serial_no: new FormControl('', [Validators.required]),
      invoice_no: new FormControl('', [Validators.required]),
    });
  }

  async customerChanged(customer) {
    const loading = await this.loadingController.create();
    await loading.present();
    this.warrantyService.getAddress(customer.name).subscribe({
      next: res => {
        loading.dismiss();
        this.address = res;
        this.warrantyClaimForm.controls.customer_address.setValue(
          this.address.name,
        );
        this.warrantyClaimForm.controls.customer_contact.setValue(
          this.address.phone,
        );
      },
    });
  }
  getOptionText(option) {
    if (option) return option.name;
  }

  getOption(option) {
    if (option) return option;
  }

  getItemOption(option) {
    if (option) return option.item_name;
  }

  getBranchOption(option) {
    if (option) return option.name;
  }

  serialChanged(name) {
    this.warrantyService.getSerial(name).subscribe({
      next: (res: SerialNoDetails) => {
        this.getSerialData = res;
        this.warrantyClaimForm.controls.invoice_no.setValue(
          res.sales_invoice_name,
        );
        this.warrantyClaimForm.controls.warranty_end_date.setValue(
          new Date(res.warranty.salesWarrantyDate),
        );
        this.warrantyClaimForm.controls.product_name.setValue({
          item_name: res.item_name,
        });
        this.warrantyClaimForm.controls.customer_name.setValue({
          name: res.customer,
        });
        this.itemOptionChanged({ item_code: res.item_code });
        this.customerChanged({ name: res.customer });
      },
      error: ({ message }) => {
        if (!message) message = UPDATE_ERROR;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  itemOptionChanged(option) {
    this.warrantyService.getItem(option.item_code).subscribe({
      next: (res: Item) => {
        this.warrantyClaimForm.controls.product_brand.setValue(res.brand);
      },
    });
  }

  branchOptionChanged(option) {}
}
