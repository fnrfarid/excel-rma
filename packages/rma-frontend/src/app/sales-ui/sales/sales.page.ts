import { Component, OnInit } from '@angular/core';
import { SalesService } from '../services/sales.service';
import { SalesInvoice } from '../../common/interfaces/sales.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
})
export class SalesPage implements OnInit {
  salesInvoiceList: Array<SalesInvoice>;

  constructor(private salesService: SalesService, private location: Location) {}

  ngOnInit() {
    this.salesService.getSalesInvoiceList().subscribe({
      next: response => {
        this.salesInvoiceList = [];
        this.salesInvoiceList = response;
      },
    });
  }

  navigateBack() {
    this.location.back();
  }
}
