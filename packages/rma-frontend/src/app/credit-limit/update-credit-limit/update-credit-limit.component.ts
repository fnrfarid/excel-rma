import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController, ToastController } from '@ionic/angular';
import { FormGroup, FormControl } from '@angular/forms';

import { UpdateCreditLimitService } from './update-credit-limit.service';
import { UPDATE_ERROR, SHORT_DURATION } from '../../constants/app-string';

@Component({
  selector: 'app-update-credit-limit',
  templateUrl: './update-credit-limit.component.html',
  styleUrls: ['./update-credit-limit.component.scss'],
})
export class UpdateCreditLimitComponent implements OnInit {
  uuid: string;
  customer: string;
  baseCreditLimit: string;
  currentCreditLimit: string;
  expiryDate: string;

  creditLimitForm = new FormGroup({
    customer: new FormControl(this.customer),
    baseLimit: new FormControl(this.baseCreditLimit),
    erpnextLimit: new FormControl(this.currentCreditLimit),
    expiryDate: new FormControl(this.expiryDate),
  });

  constructor(
    private readonly navParams: NavParams,
    private readonly popoverCtrl: PopoverController,
    private readonly toastCtrl: ToastController,
    private readonly service: UpdateCreditLimitService,
  ) {}

  ngOnInit() {
    this.uuid = this.navParams.data.uuid;
    this.customer = this.navParams.data.customer;
    this.baseCreditLimit = this.navParams.data.baseCreditLimit;
    this.currentCreditLimit = this.navParams.data.currentCreditLimit;
    this.expiryDate = this.navParams.data.expiryDate;
    this.creditLimitForm.get('customer').setValue(this.customer);
    this.creditLimitForm.get('baseLimit').setValue(this.baseCreditLimit);
    this.creditLimitForm.get('baseLimit').disable();
    this.creditLimitForm.get('erpnextLimit').setValue(this.currentCreditLimit);
    this.creditLimitForm.get('erpnextLimit').disable();
    this.creditLimitForm.get('expiryDate').setValue(this.expiryDate);
    this.creditLimitForm.get('expiryDate').disable();
  }

  async onCancel() {
    return await this.popoverCtrl.dismiss();
  }

  onUpdate() {
    this.service
      .update(
        this.uuid,
        this.creditLimitForm.controls.customer.value,
        this.creditLimitForm.controls.baseLimit.value,
        this.creditLimitForm.controls.expiryDate.value,
        this.creditLimitForm.controls.erpnextLimit.value,
      )
      .subscribe({
        next: res => {
          this.popoverCtrl.dismiss().then(dismissed => {});
        },
        error: error => {
          this.toastCtrl
            .create({
              message: UPDATE_ERROR,
              duration: SHORT_DURATION,
              showCloseButton: true,
            })
            .then(toast => toast.present());
        },
      });
  }

  toggleBaseLimit() {
    if (this.creditLimitForm.controls.baseLimit.disabled) {
      this.creditLimitForm.controls.baseLimit.enable();
    }
  }

  toggleERPNextLimit() {
    if (this.creditLimitForm.controls.erpnextLimit.disabled) {
      this.creditLimitForm.controls.erpnextLimit.enable();
    }
  }

  toggleExpiryDate() {
    if (this.creditLimitForm.controls.expiryDate.disabled) {
      this.creditLimitForm.controls.expiryDate.enable();
    }
  }
}