import { Component, OnInit, ViewChild } from '@angular/core';
import { JobsService } from '../jobs-service/jobs.service';
import { JobsDataSource } from './jobs-datasource';
import * as _ from 'lodash';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { ViewSingleJobPage } from '../view-single-job/view-single-job.page';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.page.html',
  styleUrls: ['./jobs.page.scss'],
})
export class JobsPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns: string[] = [
    'parent',
    'failCount',
    'serials',
    'status',
    'type',
  ];
  dataSource: JobsDataSource;
  sort: string = '';
  index: number = 0;
  size: number = 10;
  parent: string;
  status: string = 'Failed';
  jobStatus = ['Successful', 'Failed', 'In Queue', 'Reset', 'All', 'Retrying'];
  constructor(
    private readonly jobsService: JobsService,
    private location: Location,
    private route: ActivatedRoute,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    if (this.route.snapshot.queryParams.parent) {
      this.parent = this.route.snapshot.queryParams.parent.toUpperCase();
      this.status = 'All';
    }
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

  async viewSingleJob(row) {
    if (row.data.status === 'Failed' || row.data.status === 'Retrying') {
      const dialogRef = this.dialog.open(ViewSingleJobPage, {
        width: '50%',
        height: '50%',
        data: row,
      });
      const response = await dialogRef.afterClosed().toPromise();
      if (response) {
        this.setFilter();
      }
    }
    return;
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
    this.parent ? (query['data.parent'] = { $regex: this.parent }) : null;
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
