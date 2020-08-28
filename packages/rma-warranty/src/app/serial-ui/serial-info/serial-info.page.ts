import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl } from '@angular/forms';
import { forkJoin, from, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { SERIAL_FETCH_ERROR } from '../../constants/messages';
import { CLOSE, DURATION } from '../../constants/app-string';
import { SerialSearchService } from '../serial-search/serial-search.service';
import { AUTH_SERVER_URL } from '../../constants/storage';

@Component({
  selector: 'app-serial-info',
  templateUrl: './serial-info.page.html',
  styleUrls: ['./serial-info.page.scss'],
})
export class SerialInfoPage implements OnInit {
  serialNo: string;
  viewPRUrl: string;
  viewDNUrl: string;
  viewCustomerUrl: string;
  viewSupplierUrl: string;

  serialInfoForm = new FormGroup({
    serial_no: new FormControl(),
    item_code: new FormControl(),
    item_name: new FormControl(),
    warehouse: new FormControl(),
    purchase_document_no: new FormControl(),
    delivery_note: new FormControl(),
    customer: new FormControl(),
    supplier: new FormControl(),
  });

  constructor(
    private readonly location: Location,
    private readonly activatedRoute: ActivatedRoute,
    private readonly snackBar: MatSnackBar,
    private readonly serialSearchService: SerialSearchService,
  ) {}

  ngOnInit() {
    this.serialNo = this.activatedRoute.snapshot.params.serial;
    this.fetchSerialData();
  }

  fetchSerialData() {
    this.serialSearchService.getSerialData(this.serialNo).subscribe({
      error: error => {
        this.snackBar.open(SERIAL_FETCH_ERROR, CLOSE, { duration: DURATION });
      },
      next: res => {
        this.serialInfoForm.controls.serial_no.setValue(res.serial_no);
        this.serialInfoForm.controls.item_code.setValue(res.item_code);
        this.serialInfoForm.controls.item_name.setValue(res.item_name);
        this.serialInfoForm.controls.warehouse.setValue(res.warehouse);
        this.serialInfoForm.controls.purchase_document_no.setValue(
          res.purchase_document_no,
        );
        this.serialInfoForm.controls.delivery_note.setValue(res.delivery_note);
        this.serialInfoForm.controls.customer.setValue(res.customer);
        this.serialInfoForm.controls.supplier.setValue(res.supplier);
        this.setViewUrls();
      },
    });
  }

  setViewUrls() {
    forkJoin({
      infoAuthUrl: this.serialSearchService
        .getApiInfo()
        .pipe(map(data => data.authServerUrl)),
      storeAuthUrl: from(
        this.serialSearchService.getStore().getItem(AUTH_SERVER_URL),
      ),
    })
      .pipe(
        switchMap(({ infoAuthUrl, storeAuthUrl }) => {
          return of(storeAuthUrl ? storeAuthUrl : infoAuthUrl);
        }),
      )
      .subscribe({
        next: authServerUrl => {
          this.viewPRUrl = this.serialInfoForm.controls.purchase_document_no
            .value
            ? `${authServerUrl}/desk#Form/Purchase%20Receipt/${this.serialInfoForm.controls.purchase_document_no.value}`
            : null;
          this.viewDNUrl = this.serialInfoForm.controls.delivery_note.value
            ? `${authServerUrl}/desk#Form/Delivery%20Note/${this.serialInfoForm.controls.delivery_note.value}`
            : null;
          this.viewCustomerUrl = this.serialInfoForm.controls.customer.value
            ? `${authServerUrl}/desk#Form/Customer/${this.serialInfoForm.controls.customer.value}`
            : null;
          this.viewSupplierUrl = this.serialInfoForm.controls.supplier.value
            ? `${authServerUrl}/desk#Form/Supplier/${this.serialInfoForm.controls.supplier.value}`
            : null;
        },
        error: error => {},
      });
  }

  navigateBack() {
    this.location.back();
  }

  viewCustomer() {
    if (this.viewCustomerUrl) {
      window.open(this.viewCustomerUrl, '_blank');
    }
  }

  viewSupplier() {
    if (this.viewSupplierUrl) {
      window.open(this.viewSupplierUrl, '_blank');
    }
  }

  viewDeliveryNote() {
    if (this.viewDNUrl) {
      window.open(this.viewDNUrl, '_blank');
    }
  }

  viewPurchaseReceipt() {
    if (this.viewPRUrl) {
      window.open(this.viewPRUrl, '_blank');
    }
  }
}
