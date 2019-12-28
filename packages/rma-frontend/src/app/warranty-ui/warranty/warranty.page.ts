import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { WarrantyDataSource } from './warranty-datasource';
import { WarrantyService } from './warranty.service';
import { SERIAL_NO } from '../../constants/storage';
import { Location } from '@angular/common';

@Component({
  selector: 'app-warranty',
  templateUrl: './warranty.page.html',
  styleUrls: ['./warranty.page.scss'],
})
export class WarrantyPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: WarrantyDataSource;

  displayedColumns = ['serial_no', 'uuid', 'item_code'];
  model: string;
  search: string = '';

  constructor(
    private warrantyService: WarrantyService,
    private location: Location,
  ) {
    this.model = SERIAL_NO;
  }

  ngOnInit() {
    this.dataSource = new WarrantyDataSource(this.model, this.warrantyService);
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
}
