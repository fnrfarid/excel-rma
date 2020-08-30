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
  WarrantyClaimsDetails,
} from '../../common/interfaces/warranty.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DURATION, WARRANTY_TYPE } from './../../constants/app-string';
import {
  SOMETHING_WENT_WRONG,
  ITEM_BRAND_FETCH_ERROR,
  SERIAL_FETCH_ERROR,
  USER_SAVE_ITEM_SUGGESTION,
  ITEM_NOT_FOUND,
} from '../../constants/messages';
import { Router } from '@angular/router';
import { AUTH_SERVER_URL } from '../../constants/storage';
@Component({
  selector: 'app-add-warranty-claim',
  templateUrl: './add-warranty-claim.page.html',
  styleUrls: ['./add-warranty-claim.page.scss'],
})
export class AddWarrantyClaimPage implements OnInit {
  warrantyClaimForm: FormGroup;
  contact = {} as any;
  filteredCustomerList: any;
  claimList: any;
  getSerialData: SerialNoDetails;
  warrantyState: WarrantyState;
  productList: any;
  territoryList: any;
  itemDetail: any;
  problemList: any;

  constructor(
    private location: Location,
    private readonly time: TimeService,
    private readonly warrantyService: AddWarrantyService,
    private readonly loadingController: LoadingController,
    private readonly snackbar: MatSnackBar,
    private readonly router: Router,
  ) {}

  async ngOnInit() {
    this.claimList = [
      'Warranty',
      'Non Warranty',
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
      third_party_name: { disabled: true, active: true },
      third_party_contact: { disabled: true, active: true },
      third_party_address: { disabled: true, active: true },
    };
    this.createForm();
    this.warrantyClaimForm.controls.received_on.setValue(
      await (await this.getDateTime(new Date())).date,
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
    this.warrantyService
      .getStorage()
      .getItem('territory')
      .then(territory => {
        this.territoryList = territory;
        this.warrantyClaimForm.controls.receiving_branch.setValue(territory[0]);
      });

    this.problemList = this.warrantyClaimForm.controls.problem.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.warrantyService.getProblemList(value);
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
          third_party_name: { disabled: true, active: true },
          third_party_contact: { disabled: true, active: true },
          third_party_address: { disabled: true, active: true },
        };
        this.isDisabled();
        this.clearAllValidators('Non Serial Warranty');
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
          third_party_name: { disabled: true, active: true },
          third_party_contact: { disabled: true, active: true },
          third_party_address: { disabled: true, active: true },
        };
        this.isDisabled();
        this.clearAllValidators('Third Party Warranty');
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
          third_party_name: { disabled: true, active: true },
          third_party_contact: { disabled: true, active: true },
          third_party_address: { disabled: true, active: true },
        };
        this.isDisabled();
        this.clearAllValidators('Warranty');

        break;
    }
  }

  setValidators(type: string) {
    const obj = {
      Warranty: ['serial_no', 'invoice_no', 'customer_name'],
      'Non Serial Warranty': ['customer_name'],
      'Third Party Warranty': ['third_party_name'],
    };
    obj[type].forEach(element => {
      this.warrantyClaimForm.get(element).setValidators(Validators.required);
      this.warrantyClaimForm.get(element).updateValueAndValidity();
    });
  }

  clearAllValidators(type: string) {
    const common_control = [
      'product_brand',
      'problem',
      'claim_type',
      'received_on',
      'delivery_date',
      'receiving_branch',
    ];
    Object.keys(this.warrantyClaimForm.controls).forEach(element => {
      this.warrantyClaimForm.get(element).clearValidators();
      this.warrantyClaimForm.get(element).updateValueAndValidity();
    });
    common_control.forEach(element => {
      this.warrantyClaimForm.get(element).setValidators(Validators.required);
      this.warrantyClaimForm.get(element).updateValueAndValidity();
    });
    this.setValidators(type);
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
    return { date: DateTime.date, time: DateTime.time };
  }

  async getDeliveryDate(date: Date) {
    date.setDate(date.getDate() + 3);
    return (await this.getDateTime(date)).date;
  }

  get f() {
    return this.warrantyClaimForm.controls;
  }

  navigateBack() {
    this.location.back();
  }

  async submitDraft() {
    const loading = await this.loadingController.create();
    await loading.present();
    const detail = await this.assignFields();

    return this.warrantyService.createWarrantyClaim(detail).subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigate(['/warranty']);
      },
      error: ({ message }) => {
        loading.dismiss();
        if (!message) message = SOMETHING_WENT_WRONG;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  async assignFields() {
    const warrantyClaimDetails = {} as WarrantyClaimsDetails;
    warrantyClaimDetails.claim_type = this.warrantyClaimForm.controls.claim_type.value;
    warrantyClaimDetails.received_on = this.warrantyClaimForm.controls.received_on.value;
    warrantyClaimDetails.delivery_date = this.warrantyClaimForm.controls.delivery_date.value;
    warrantyClaimDetails.receiving_branch = this.warrantyClaimForm.controls.receiving_branch.value;
    warrantyClaimDetails.delivery_branch = this.warrantyClaimForm.controls.delivery_branch.value;
    warrantyClaimDetails.product_brand = this.warrantyClaimForm.controls.product_brand.value;
    warrantyClaimDetails.problem = this.warrantyClaimForm.controls.problem.value.problem_name;
    warrantyClaimDetails.problem_details = this.warrantyClaimForm.controls.problem_details.value;
    warrantyClaimDetails.remarks = this.warrantyClaimForm.controls.remarks.value;
    warrantyClaimDetails.customer_contact = this.warrantyClaimForm.controls.customer_contact.value;
    warrantyClaimDetails.customer_address = this.warrantyClaimForm.controls.customer_address.value;
    warrantyClaimDetails.third_party_name = this.warrantyClaimForm.controls.third_party_name.value;
    warrantyClaimDetails.third_party_contact = this.warrantyClaimForm.controls.third_party_contact.value;
    warrantyClaimDetails.third_party_address = this.warrantyClaimForm.controls.third_party_address.value;
    warrantyClaimDetails.item_name = this.warrantyClaimForm.controls.product_name.value.item_name;
    warrantyClaimDetails.customer = this.warrantyClaimForm.controls.customer_name.value.name;
    warrantyClaimDetails.item_code = this.itemDetail.item_code;
    warrantyClaimDetails.warranty_claim_date = this.warrantyClaimForm.controls.received_on.value;
    warrantyClaimDetails.posting_time = await (
      await this.getDateTime(new Date())
    ).time;
    switch (warrantyClaimDetails.claim_type) {
      case 'Warranty':
        warrantyClaimDetails.serial_no = this.warrantyClaimForm.controls.serial_no.value;
        warrantyClaimDetails.invoice_no = this.warrantyClaimForm.controls.invoice_no.value;
        warrantyClaimDetails.warranty_end_date = this.warrantyClaimForm.controls.warranty_end_date.value;
        break;
      case 'Non Warranty':
        warrantyClaimDetails.serial_no = this.warrantyClaimForm.controls.serial_no.value;
        warrantyClaimDetails.invoice_no = this.warrantyClaimForm.controls.invoice_no.value;
        warrantyClaimDetails.warranty_end_date = this.warrantyClaimForm.controls.warranty_end_date.value;
        break;
      case 'Third Party Warranty':
        warrantyClaimDetails.serial_no = this.warrantyClaimForm.controls.serial_no.value;
        break;

      default:
        break;
    }
    return warrantyClaimDetails;
  }

  createForm() {
    this.warrantyClaimForm = new FormGroup({
      warranty_end_date: new FormControl(''),
      claim_type: new FormControl('', [Validators.required]),
      received_on: new FormControl(''),
      delivery_date: new FormControl(''),
      receiving_branch: new FormControl(''),
      delivery_branch: new FormControl(''),
      product_brand: new FormControl(''),
      problem: new FormControl(''),
      problem_details: new FormControl(''),
      remarks: new FormControl(''),
      customer_contact: new FormControl(),
      customer_address: new FormControl(),
      third_party_name: new FormControl(''),
      third_party_contact: new FormControl(''),
      third_party_address: new FormControl(''),
      product_name: new FormControl(''),
      customer_name: new FormControl(''),
      serial_no: new FormControl(''),
      invoice_no: new FormControl(''),
    });
  }

  async customerChanged(customer) {
    const loading = await this.loadingController.create();
    await loading.present();
    this.warrantyService.getAddress(customer.name).subscribe({
      next: res => {
        loading.dismiss();
        this.contact = res;
        if (!res.customer_primary_address) {
          if (!res.mobile_no) {
            this.snackbar.open(
              'Customer Address and Contact Not found',
              'Close',
              {
                duration: DURATION,
              },
            );
          } else {
            this.snackbar.open('Address Not found', 'Close', {
              duration: DURATION,
            });
            this.warrantyClaimForm.controls.customer_contact.setValue(
              this.contact.mobile_no,
            );
          }
        } else if (!res.mobile_no) {
          this.snackbar.open('Customer Contact Not found', 'Close', {
            duration: DURATION,
          });
          this.warrantyClaimForm.controls.customer_address.setValue(
            this.contact.customer_primary_address,
          );
        } else {
          this.warrantyClaimForm.controls.customer_contact.setValue(
            this.contact.mobile_no,
          );
          this.warrantyClaimForm.controls.customer_address.setValue(
            this.contact.customer_primary_address,
          );
        }
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
    if (option) return option;
  }

  getProblemOption(option) {
    if (option) return option.problem_name;
  }

  serialChanged(name) {
    this.warrantyService.getSerial(name).subscribe({
      next: (res: SerialNoDetails) => {
        this.getSerialData = res;
        if (!res.delivery_note) {
          this.snackbar.open('Serial not sold yet', 'Close', {
            duration: DURATION,
          });
        } else {
          if (
            this.warrantyClaimForm.controls.received_on.value <
            this.getSerialData.warranty.salesWarrantyDate
          ) {
            this.warrantyClaimForm.controls.claim_type.setValue(
              WARRANTY_TYPE.WARRANTY,
            );
          } else {
            this.warrantyClaimForm.controls.claim_type.setValue(
              WARRANTY_TYPE.NON_WARRANTY,
            );
          }
          this.warrantyClaimForm.controls.warranty_end_date.setValue(
            res.warranty.salesWarrantyDate,
          );
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
        }
      },
      error: ({ message }) => {
        if (!message) message = `${SOMETHING_WENT_WRONG}${SERIAL_FETCH_ERROR}`;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  dateChanges(option) {
    this.getDateTime(option).then(date => {
      if (this.warrantyClaimForm.controls.received_on.value < date.date) {
        this.warrantyClaimForm.controls.claim_type.setValue(
          WARRANTY_TYPE.WARRANTY,
        );
      } else {
        this.warrantyClaimForm.controls.claim_type.setValue(
          WARRANTY_TYPE.NON_WARRANTY,
        );
      }
    });
  }

  itemOptionChanged(option) {
    this.warrantyService.getItem(option.item_code).subscribe({
      next: (res: Item) => {
        this.itemDetail = res;
        if (!res.brand) {
          this.getItemBrandFromERP(res.item_code);
        }
        this.warrantyClaimForm.controls.product_brand.setValue(res.brand);
      },
      error: ({ message }) => {
        this.openERPItem(option.item_code);
        if (!message) message = `${ITEM_NOT_FOUND}`;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  getItemBrandFromERP(item_code: string) {
    this.warrantyService.getItemBrandFromERP(item_code).subscribe({
      next: res => {
        if (!res.brand) {
          this.snackbar.open(ITEM_BRAND_FETCH_ERROR, 'Close', {
            duration: DURATION,
          });
        } else {
          this.snackbar
            .open(USER_SAVE_ITEM_SUGGESTION, 'open item', {
              duration: 5500,
            })
            .onAction()
            .subscribe(() => {
              this.openERPItem(item_code);
            });
          this.warrantyClaimForm.controls.product_brand.setValue(res.brand);
        }
      },
      error: err => {
        this.snackbar.open(ITEM_NOT_FOUND, 'Close', { duration: DURATION });
      },
    });
  }

  openERPItem(item_code: string) {
    this.warrantyService
      .getStorage()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        window.open(`${auth_url}/desk#Form/Item/${item_code}`, '_blank');
      });
  }

  branchOptionChanged(option) {}
}
