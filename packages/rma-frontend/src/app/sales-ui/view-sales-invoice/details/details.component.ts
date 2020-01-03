import { Component, OnInit } from '@angular/core';
import { DetailsDataSource } from './details-datasource';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'sales-invoice-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  displayedColumns = ['item', 'quantity', 'rate', 'total'];

  dataSource: DetailsDataSource;

  constructor(private salesService: SalesService) {}

  ngOnInit() {
    this.dataSource = new DetailsDataSource(this.salesService);
    this.dataSource.loadItems();
  }
}
