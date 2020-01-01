import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator, MatSort } from '@angular/material';
import { WarrantyService } from '../warranty/warranty.service';
import { Router } from '@angular/router';
import { WARRANTY_CLAIM } from '../../constants/storage';
import {
  WarrantyClaimDataSource,
  WarrantyClaimListingData,
} from './warranty-claim.datasource';

@Component({
  selector: 'app-warranty-claim',
  templateUrl: './warranty-claim.page.html',
  styleUrls: ['./warranty-claim.page.scss'],
})
export class WarrantyClaimPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: WarrantyClaimDataSource;
  claim: string;
  selectedClaimDataSource = [];
  selectedClaimColumns = ['company', 'supplier', 'serial_no', 'item'];
  displayedColumns = ['claim', 'company', 'supplier', 'date', 'items'];
  model: string;
  search: string = '';
  supplier: string;
  company: string;

  constructor(
    private warrantyService: WarrantyService,
    private location: Location,
    private readonly router: Router,
  ) {
    this.model = WARRANTY_CLAIM;
  }

  ngOnInit() {
    this.dataSource = new WarrantyClaimDataSource(
      this.model,
      this.warrantyService,
    );
    this.dataSource.loadItems();
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }

  setFilter() {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }

  snakeToTitleCase(string: string) {
    if (!string) return;

    return string
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  navigateBack() {
    this.location.back();
  }

  changeRoute(route: string) {
    this.router.navigateByUrl(route);
  }

  updateItem(row: WarrantyClaimListingData) {
    this.supplier = row.supplier;
    this.company = row.company;
    this.claim = row.claim;
    this.selectedClaimDataSource = row.items;
  }
}
