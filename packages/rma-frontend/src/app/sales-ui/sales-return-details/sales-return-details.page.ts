import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';
import {
  SalesReturnDetails,
  SalesReturnItem,
} from '../../common/interfaces/sales-return.interface';
import { AUTH_SERVER_URL } from '../../constants/storage';

@Component({
  selector: 'app-sales-return-details',
  templateUrl: './sales-return-details.page.html',
  styleUrls: ['./sales-return-details.page.scss'],
})
export class SalesReturnDetailsPage implements OnInit {
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];
  dataSource: SalesReturnItem[] = [];

  salesReturnDetials: SalesReturnDetails;
  viewSalesReturnURL: string = '';
  salesReturnName: string = '';
  constructor(
    private readonly route: ActivatedRoute,
    private readonly salesReturnService: SalesReturnService,
  ) {}

  ngOnInit() {
    this.salesReturnDetials = {} as SalesReturnDetails;
    this.getReturnDeliveryNote();
  }

  getReturnDeliveryNote() {
    this.salesReturnName = this.route.snapshot.params.name;
    this.salesReturnService.getSalesReturn(this.salesReturnName).subscribe({
      next: (res: SalesReturnDetails) => {
        this.salesReturnDetials = res;
        this.dataSource = res.items;
        this.getSalesReturnURL();
      },
    });
  }

  getSalesReturnURL() {
    this.salesReturnService
      .getStore()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        this.viewSalesReturnURL = `${auth_url}/desk#Form/Delivery Note/${this.salesReturnName}`;
      });
  }
}
