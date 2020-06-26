import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TimeService } from '../../api/time/time.service';
@Component({
  selector: 'app-add-warranty-claim',
  templateUrl: './add-warranty-claim.page.html',
  styleUrls: ['./add-warranty-claim.page.scss'],
})
export class AddWarrantyClaimPage implements OnInit {
  warrantyClaimForm: FormGroup;

  constructor(private location: Location, private readonly time: TimeService) {}

  async ngOnInit() {
    this.createForm();
    this.warrantyClaimForm.controls.received_on.setValue(
      await this.getDateTime(new Date()),
    );
    this.warrantyClaimForm.controls.delivery_date.setValue(
      await this.getDeliveryDate(new Date()),
    );
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
      received_by: new FormControl('', [Validators.required]),
      delivered_by: new FormControl('', [Validators.required]),
      serial_no: new FormControl('', [Validators.required]),
      invoice_no: new FormControl('', [Validators.required]),
      item_name: new FormControl('', [Validators.required]),
      product_brand: new FormControl('', [Validators.required]),
      problem: new FormControl('', [Validators.required]),
      problem_details: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [Validators.required]),
      customer: new FormControl('', [Validators.required]),
      customer_contact: new FormControl('', [Validators.required]),
      customer_address: new FormControl('', [Validators.required]),
      third_party_name: new FormControl('', [Validators.required]),
      third_party_contact: new FormControl('', [Validators.required]),
      third_party_address: new FormControl('', [Validators.required]),
      product_name: new FormControl('', [Validators.required]),
      customer_name: new FormControl('', [Validators.required]),
    });
  }
}
