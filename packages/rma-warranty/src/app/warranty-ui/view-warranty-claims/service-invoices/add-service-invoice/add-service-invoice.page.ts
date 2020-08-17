import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TimeService } from '../../../../api/time/time.service';
import {
  Item,
  WarrantyClaimsDetails,
} from '../../../../common/interfaces/warranty.interface';
import { AddServiceInvoiceService } from './add-service-invoice.service';
import { Observable } from 'rxjs';
import { startWith, switchMap, map, debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceInvoiceDetails } from './service-invoice-interface';
import {
  DURATION,
  CLOSE,
  SERVICE_INVOICE_STATUS,
  UPDATE_ERROR,
} from '../../../../constants/app-string';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingController } from '@ionic/angular';
import { ItemsDataSource } from '../items-datasource';

@Component({
  selector: 'app-add-service-invoice',
  templateUrl: './add-service-invoice.page.html',
  styleUrls: ['./add-service-invoice.page.scss'],
})
export class AddServiceInvoicePage implements OnInit {
  posting_date: { date: string; time: string };
  serviceInvoiceForm: FormGroup;
  dataSource: ItemsDataSource;
  itemsControl: FormArray;
  displayedColumns: string[] = [
    'item_group',
    'item_name',
    'quantity',
    'rate',
    'total',
    'delete',
  ];
  filteredCustomerList: Observable<any[]>;
  territoryList: Observable<any[]>;
  warrantyDetails: WarrantyClaimsDetails;
  accountList: Observable<any[]>;
  addressList: Observable<any[]>;
  get f() {
    return this.serviceInvoiceForm.controls;
  }
  async getCurrentDate() {
    const date = new Date();
    const DateTime = await this.time.getDateAndTime(date);
    return DateTime.date;
  }
  constructor(
    private readonly location: Location,
    private readonly time: TimeService,
    private readonly serviceInvoiceService: AddServiceInvoiceService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly snackbar: MatSnackBar,
    private readonly loadingController: LoadingController,
  ) {}

  async ngOnInit() {
    this.createFormGroup();
    this.getCurrentDate();
    this.dataSource = new ItemsDataSource();
    this.serviceInvoiceForm.controls.posting_date.setValue(
      await this.getCurrentDate(),
    );
    this.serviceInvoiceService
      .getStore()
      .getItem('territory')
      .then(territory => {
        this.territoryList = territory;
      });
    this.serviceInvoiceService.getAccountList().subscribe({
      next: response => {
        this.accountList = response;
      },
      error: error => {},
    });

    this.serviceInvoiceService.getCashAccount().subscribe({
      next: response => {
        this.serviceInvoiceForm.controls.account.setValue(response[0]);
      },
    });

    this.serviceInvoiceService.getAddressList().subscribe({
      next: response => {
        this.addressList = response;
      },
      error: error => {},
    });
    this.filteredCustomerList = this.serviceInvoiceForm
      .get('customer_name')
      .valueChanges.pipe(
        debounceTime(500),
        startWith(''),
        switchMap(value => {
          return this.serviceInvoiceService
            .getCustomerList(value)
            .pipe(map(res => res.docs));
        }),
      );
    this.serviceInvoiceService
      .getWarrantyDetail(this.activatedRoute.snapshot.params.uuid)
      .subscribe({
        next: (res: WarrantyClaimsDetails) => {
          this.serviceInvoiceForm.controls.customer_name.setValue({
            name: res.customer,
          });
          this.serviceInvoiceForm.controls.customer_contact.setValue(
            res.customer_contact,
          );
          this.serviceInvoiceForm.controls.customer_address.setValue({
            name: res.customer_address,
          });
          this.serviceInvoiceForm.controls.third_party_name.setValue(
            res.third_party_name,
          );
          this.serviceInvoiceForm.controls.third_party_contact.setValue(
            res.third_party_contact,
          );
          this.serviceInvoiceForm.controls.third_party_address.setValue(
            res.third_party_address,
          );
          this.serviceInvoiceForm.controls.branch.setValue(
            res.receiving_branch,
          );
          this.warrantyDetails = res;
        },
        error: err => {},
      });
  }

  createFormGroup() {
    this.serviceInvoiceForm = new FormGroup({
      customer_name: new FormControl('', [Validators.required]),
      customer_contact: new FormControl('', [Validators.required]),
      customer_address: new FormControl('', [Validators.required]),
      third_party_name: new FormControl('', [Validators.required]),
      third_party_contact: new FormControl('', [Validators.required]),
      third_party_address: new FormControl('', [Validators.required]),
      account: new FormControl('', [Validators.required]),
      posting_date: new FormControl('', [Validators.required]),
      branch: new FormControl('', [Validators.required]),
      items: new FormArray([], this.itemValidator),
      total: new FormControl(0),
    });
    this.itemsControl = this.serviceInvoiceForm.get('items') as FormArray;
  }

  navigateBack() {
    this.location.back();
  }

  async selectedPostingDate($event) {
    this.posting_date = await this.time.getDateAndTime($event.value);
  }

  async submitDraft() {
    const isValid = this.serviceInvoiceService.validateItemList(
      this.dataSource.data().map(item => item.item_code),
    );
    if (isValid) {
      const serviceInvoiceDetails = {} as ServiceInvoiceDetails;
      serviceInvoiceDetails.warrantyClaimUuid = this.activatedRoute.snapshot.params.uuid;
      serviceInvoiceDetails.customer = this.serviceInvoiceForm.controls.customer_name.value.name;
      serviceInvoiceDetails.customer_contact = this.serviceInvoiceForm.controls.customer_contact.value;
      serviceInvoiceDetails.total_qty = 0;
      serviceInvoiceDetails.total = 0;
      serviceInvoiceDetails.status = SERVICE_INVOICE_STATUS.SUBMITTED;
      serviceInvoiceDetails.due_date = this.serviceInvoiceForm.controls.posting_date.value;
      serviceInvoiceDetails.remarks = this.warrantyDetails.remarks;
      serviceInvoiceDetails.date = this.serviceInvoiceForm.controls.posting_date.value;
      serviceInvoiceDetails.customer_third_party = this.warrantyDetails.claim_type;
      serviceInvoiceDetails.branch = this.serviceInvoiceForm.controls.branch.value.name;
      serviceInvoiceDetails.posting_date = this.serviceInvoiceForm.controls.posting_date.value;
      serviceInvoiceDetails.customer_name = this.serviceInvoiceForm.controls.customer_name.value.name;
      serviceInvoiceDetails.customer_address = this.serviceInvoiceForm.controls.customer_address.value.name;
      serviceInvoiceDetails.third_party_name = this.serviceInvoiceForm.controls.third_party_name.value;
      serviceInvoiceDetails.third_party_address = this.serviceInvoiceForm.controls.third_party_address.value;
      serviceInvoiceDetails.third_party_contact = this.serviceInvoiceForm.controls.third_party_contact.value;
      serviceInvoiceDetails.debit_to = this.serviceInvoiceForm.controls.account.value.name;
      serviceInvoiceDetails.docstatus = 1;

      const itemList = this.dataSource.data().filter(item => {
        if (item.item_name !== '') {
          item.amount = item.qty * item.rate;
          serviceInvoiceDetails.total_qty += item.qty;
          serviceInvoiceDetails.total += item.amount;
          return item;
        }
      });
      serviceInvoiceDetails.items = itemList;
      const loading = await this.loadingController.create();
      await loading.present();
      this.serviceInvoiceService
        .createServiceInvoice(serviceInvoiceDetails)
        .subscribe({
          next: () => {
            loading.dismiss();
            this.router.navigate([
              '/warranty/view-warranty-claims',
              this.activatedRoute.snapshot.params.uuid,
            ]);
          },
          error: ({ message }) => {
            loading.dismiss();
            if (!message) message = UPDATE_ERROR;
            this.snackbar.open(message, 'Close', {
              duration: DURATION,
            });
          },
        });
    } else {
      this.snackbar.open('Error : Duplicate Items added.', CLOSE, {
        duration: DURATION,
      });
    }
  }

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_code = '';
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.minimumPrice = 0;
    data.push(item);
    this.itemsControl.push(new FormControl(item));
    this.dataSource.update(data);
  }

  updateItem(row: Item, index: number, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    Object.assign(row, item);
    row.item_group = item.item_group;
    row.qty = 1;
    row.rate = item.rate;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(copy);
    this.itemsControl.controls[index].setValue(item);
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.qty = quantity;
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(copy);
  }

  itemValidator(items: FormArray) {
    if (items.length === 0) {
      return { items: true };
    } else {
      const itemList = items
        .getRawValue()
        .filter(item => item.item_name !== '');
      if (itemList.length !== items.length) {
        return { items: true };
      } else return null;
    }
  }

  updateRate(row: Item, rate: number) {
    if (rate == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    if (row.minimumPrice && row.minimumPrice > rate) {
      row.rate = row.minimumPrice;
    } else {
      row.rate = rate;
    }
    this.calculateTotal(this.dataSource.data().slice());

    this.dataSource.update(copy);
  }

  calculateTotal(itemList: Item[]) {
    let sum = 0;
    itemList.forEach(item => {
      sum += item.qty * item.rate;
    });
    this.serviceInvoiceForm.get('total').setValue(sum);
  }

  deleteRow(i: number) {
    this.dataSource.data().splice(i, 1);
    this.itemsControl.removeAt(i);
    this.calculateTotal(this.dataSource.data().slice());
    this.dataSource.update(this.dataSource.data());
  }

  getOption(option) {
    if (option) return option.name;
  }

  getBranchOption(option) {
    if (option) return option;
  }

  getSelectedOption(option) {}
}
