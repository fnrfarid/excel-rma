import { Component, OnInit, ViewChild } from '@angular/core';
import { PurchaseService } from '../services/purchase.service';
import { PurchaseInvoiceDataSource } from './purchase-invoice-datasource';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { PurchaseInvoice } from '../../common/interfaces/purchase.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.page.html',
  styleUrls: ['./purchase.page.scss'],
})
export class PurchasePage implements OnInit {
  salesInvoiceList: Array<PurchaseInvoice>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: PurchaseInvoiceDataSource;
  displayedColumns = [
    'purchase_invoice_number',
    'status',
    'date',
    'supplier',
    'total',
    'created_by',
    'delivered_by',
  ];
  invoiceStatus: string[] = ['Completed', 'Rejected', 'Submitted', 'All'];
  supplier: string = '';
  status: string = 'All';
  name: string = '';
  search: string = '';
  constructor(
    private location: Location,
    private readonly purchaseService: PurchaseService,
  ) {}

  ngOnInit() {
    this.dataSource = new PurchaseInvoiceDataSource(this.purchaseService);
    this.dataSource.loadItems();
  }

  getUpdate(event) {
    const query: any = {};
    if (this.supplier) query.supplier_name = this.supplier;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;
    this.dataSource.loadItems(
      undefined,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  setFilter(event?) {
    const query: any = {};
    if (this.supplier) query.supplier_name = this.supplier;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;

    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    this.dataSource.loadItems(
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      query,
    );
  }

  statusChange(status) {
    if (status === 'All') {
      this.dataSource.loadItems();
    } else {
      this.status = status;
      this.setFilter();
    }
  }

  navigateBack() {
    this.location.back();
  }
}
