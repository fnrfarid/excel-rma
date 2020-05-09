import { Component, OnInit, ViewChild } from '@angular/core';
import { JobsService } from './jobs.service';
import { JobsDataSource } from './jobs-datasource';
import * as _ from 'lodash';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.page.html',
  styleUrls: ['./jobs.page.scss'],
})
export class JobsPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns: string[] = ['name', 'status', 'parent', 'serials', 'type'];
  dataSource: JobsDataSource;
  sort: string = '';
  index: number = 0;
  size: number = 10;
  name: string;
  status: string = 'Failed';
  jobStatus = ['Successful', 'Failed', 'In Queue', 'Reset', 'All'];
  constructor(
    private readonly jobsService: JobsService,
    private location: Location,
  ) {}

  ngOnInit() {
    this.dataSource = new JobsDataSource(this.jobsService);
    this.setFilter();
  }
  getUpdate(event) {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.setFilter();
  }

  navigateBack() {
    this.location.back();
  }

  getSerialValue(element: JobItem) {
    const serials = [];
    element.items.forEach(item => {
      if (item.has_serial_no === 0) {
        return;
      }
      if (item.serial_no) {
        if (typeof item.serial_no === 'string') {
          serials.push(...item.serial_no.split('\n'));
        } else {
          serials.push(...item.serial_no);
        }
      }
    });
    if (serials.length) {
      return `${serials[0]} - ${serials[serials.length - 1]}`;
    }
    return `Non serial Item`;
  }

  getCamelCase(value: string) {
    return _.camelCase(value.replace('_', ' '));
  }

  getPurchaseSerialValue(element: JobItem[]) {
    const serials = [];
    element.forEach(job => {
      job.items.forEach(item => {
        if (item.has_serial_no === 0) {
          return;
        }
        if (item.serial_no) {
          if (typeof item.serial_no === 'string') {
            serials.push(...item.serial_no.split('\n'));
          } else {
            serials.push(...item.serial_no);
          }
        }
      });
    });
    if (serials.length) {
      return `${serials[0]} - ${serials[serials.length - 1]}`;
    }
    return `Non serial Item`;
  }

  setFilter(event?) {
    const query: any = {};
    this.status !== 'All' ? (query['data.status'] = this.status) : null;
    this.name ? (query['data.parent'] = { $regex: this.name }) : null;
    let sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    sortQuery =
      Object.keys(sortQuery).length === 0 ? { created_on: 'DESC' } : sortQuery;

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
}

export class JobItem {
  items: { serial_no: any; has_serial_no: number }[];
}
