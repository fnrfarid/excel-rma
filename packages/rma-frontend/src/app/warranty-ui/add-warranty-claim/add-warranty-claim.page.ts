import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TimeService } from '../../api/time/time.service';
import { AddWarrantyService } from './add-warranty.service';
import { startWith, switchMap, map, debounceTime } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';
import { WarrantyState } from '../../common/interfaces/warranty.interface';
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
  getSerialData: any;
  warrantyState: WarrantyState;

  constructor(
    private location: Location,
    private readonly time: TimeService,
    private readonly warrantyService: AddWarrantyService,
    private readonly loadingController: LoadingController,
  ) {}

  async ngOnInit() {
    this.claimList = [
      { warranty: 'Warranty / Non Warranty' },
      { warranty: 'Non Serial Warranty' },
      { warranty: 'Third Party Warranty' },
    ];
    this.warrantyState = {
      serial_no: { disabled: false, active: false },
      invoice_no: { disabled: false, active: false },
      warranty_end_date: { disabled: false, active: false },
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
        return this.warrantyService
          .getCustomerList(value)
          .pipe(map(res => res.docs));
      }),
    );
  }

  getFormState(state) {
    if (state.warranty === 'Non Serial Warranty') {
      this.warrantyState = {
        serial_no: { disabled: false, active: false },
        invoice_no: { disabled: false, active: false },
        warranty_end_date: { disabled: false, active: false },
      };
    } else if (state.warranty === 'Third Party Warranty') {
      this.warrantyState = {
        serial_no: { disabled: true, active: true },
        invoice_no: { disabled: true, active: false },
        warranty_end_date: { disabled: true, active: false },
      };
      this.warrantyClaimForm.addControl(
        'serial_no',
        new FormControl('', Validators.required),
      );
    } else {
      this.warrantyState = {
        serial_no: { disabled: true, active: true },
        invoice_no: { disabled: true, active: true },
        warranty_end_date: { disabled: true, active: true },
      };
      this.warrantyClaimForm.addControl(
        'warranty_end_date',
        new FormControl('', Validators.required),
      );
      this.warrantyClaimForm.addControl(
        'serial_no',
        new FormControl('', Validators.required),
      );
      this.warrantyClaimForm.addControl(
        'invoice_no',
        new FormControl('', Validators.required),
      );
    }
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
    if (option) return option.warranty;
  }

  serialChanged(name) {}
}
