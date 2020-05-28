import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';
import {
  SalesReturnDetails,
  SalesReturnItem,
} from '../../common/interfaces/sales-return.interface';
import { AUTH_SERVER_URL } from '../../constants/storage';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface Serials {
  item_code?: string;
  item_name?: string;
  serial_no?: string;
}
@Component({
  selector: 'app-sales-return-details',
  templateUrl: './sales-return-details.page.html',
  styleUrls: ['./sales-return-details.page.scss'],
})
export class SalesReturnDetailsPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns = ['item_code', 'item_name', 'qty', 'rate', 'amount'];
  serialDisplayedColumns = ['item_code', 'item_name', 'serial'];

  dataSource: SalesReturnItem[] = [];
  salesReturnDetials: SalesReturnDetails;
  viewSalesReturnURL: string = '';
  salesReturnName: string = '';
  serials: Serials[] = [];
  serialDataSource: MatTableDataSource<Serials>;

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
        this.loadSerials();
      },
    });
  }

  loadSerials() {
    for (const item of this.dataSource) {
      for (const serial of item.serial_no.split('\n')) {
        this.serials.push({
          item_code: item.item_code,
          item_name: item.item_name,
          serial_no: serial,
        });
      }
    }
    this.serialDataSource = new MatTableDataSource(this.serials);
    this.serialDataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.serialDataSource.filter = filterValue.trim().toLowerCase();
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
