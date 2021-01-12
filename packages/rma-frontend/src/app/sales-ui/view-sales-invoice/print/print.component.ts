import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';
import { StorageService } from '../../../api/storage/storage.service';
import {
  AUTH_SERVER_URL,
  PRINT_FORMAT_PREFIX,
} from '../../../constants/storage';
import {
  PRINT_SALES_INVOICE_PDF_METHOD,
  PRINT_DELIVERY_NOTE_PDF_METHOD,
} from '../../../constants/url-strings';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
})
export class PrintComponent implements OnInit {
  invoice_name: string = '';
  printSalesInvoiceURL: string = '';
  printDeliveryNoteURL: string = '';
  constructor(
    private readonly navParams: NavParams,
    private readonly storage: StorageService,
    private readonly salesService: SalesService,
    private popoverController: PopoverController,
  ) {}

  ngOnInit() {
    this.invoice_name = this.navParams.data.invoice_name;
    this.getPrintSalesInvoiceURL();
    this.getPrintDeliveryNoteURL();
  }

  async getPrintSalesInvoiceURL() {
    const authURL = await this.storage.getItem(AUTH_SERVER_URL);
    const url = `${authURL}${PRINT_SALES_INVOICE_PDF_METHOD}`;
    const doctype = 'Sales Invoice';
    const name = `name=${this.invoice_name}`;
    const no_letterhead = 'no_letterhead=0';
    this.printSalesInvoiceURL = `${url}?doctype=${doctype}&${name}&format=${
      PRINT_FORMAT_PREFIX + doctype
    }&${no_letterhead}`;
  }

  getPrintDeliveryNoteURL() {
    this.salesService.getDeliveryNoteNames(this.invoice_name).subscribe({
      next: async res => {
        if (res.length !== 0) {
          const deliveryNoteNames = [
            ...new Set(res.map(deliveryNote => deliveryNote.name)),
          ];
          const authURL = await this.storage.getItem(AUTH_SERVER_URL);
          const url = `${authURL}${PRINT_DELIVERY_NOTE_PDF_METHOD}`;
          const doctype = 'Delivery Note';
          const name = `name=${JSON.stringify(deliveryNoteNames)}`;
          const no_letterhead = 'no_letterhead=0';
          this.printDeliveryNoteURL = `${url}?doctype=${doctype}&${name}&format=${
            PRINT_FORMAT_PREFIX + doctype
          }&${no_letterhead}`;
        } else this.printDeliveryNoteURL = '';
      },
    });
  }

  closePopover() {
    this.popoverController.dismiss();
  }
}
