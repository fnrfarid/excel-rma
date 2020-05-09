import { Component, OnInit } from '@angular/core';
import { JobsService } from './jobs.service';
import { JobsDataSource } from './jobs-datasource';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.page.html',
  styleUrls: ['./jobs.page.scss'],
})
export class JobsPage implements OnInit {
  displayedColumns: string[] = ['name', 'status', 'parent', 'type'];
  dataSource: JobsDataSource;
  sort: string = '';
  index: number = 0;
  size: number = 10;

  constructor(private readonly jobsService: JobsService) {}

  ngOnInit() {
    this.dataSource = new JobsDataSource(this.jobsService);
    this.dataSource.loadItems(this.sort, this.index, this.size);
  }
  getUpdate(event) {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.dataSource.loadItems(this.sort, this.index, this.size);
  }
}
