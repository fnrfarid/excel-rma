import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';

@Component({
  selector: 'app-add-service-invoice',
  templateUrl: './add-service-invoice.page.html',
  styleUrls: ['./add-service-invoice.page.scss'],
})
export class AddServiceInvoicePage implements OnInit {
  postingDate: { date: string; time: string };
  serviceInvoiceForm: FormGroup;
  get f() {
    return this.serviceInvoiceForm.controls;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
  ) {}

  ngOnInit() {
    this.createFormGroup();
  }
  createFormGroup() {
    this.serviceInvoiceForm = new FormGroup({
      warehouse: new FormControl('', [Validators.required]),
      customerName: new FormControl('', [Validators.required]),
      customerContact: new FormControl('', [Validators.required]),
      customerAddress: new FormControl('', [Validators.required]),
      thirdPartyName: new FormControl('', [Validators.required]),
      thirdPartyContact: new FormControl('', [Validators.required]),
      thirdPartyAddress: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      account: new FormControl('', [Validators.required]),
      postingDate: new FormControl('', [Validators.required]),
      branch: new FormControl('', [Validators.required]),
    });
  }

  navigateBack() {
    this.location.back();
  }

  async selectedPostingDate($event) {
    this.postingDate = await this.time.getDateAndTime($event.value);
  }

  submitDraft() {}
}
