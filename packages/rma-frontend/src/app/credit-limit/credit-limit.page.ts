import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PopoverController } from '@ionic/angular';
import { CreditLimitDataSource } from './credit-limit-datasource';
import { SalesService } from '../sales-ui/services/sales.service';
import { UpdateCreditLimitComponent } from './update-credit-limit/update-credit-limit.component';
import { DEFAULT_COMPANY } from '../constants/storage';
import { StorageService } from '../api/storage/storage.service';

@Component({
  selector: 'app-credit-limit',
  templateUrl: './credit-limit.page.html',
  styleUrls: ['./credit-limit.page.scss'],
})
export class CreditLimitPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: CreditLimitDataSource;
  displayedColumns = [
    'name',
    'customer_name',
    'credit_limits',
    'extended_credit_limit',
    'expiry_date',
    'set_by',
    'set_on',
  ];
  search: string = '';

  constructor(
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly storage: StorageService,
    private readonly popoverController: PopoverController,
  ) {}

  ngOnInit() {
    this.dataSource = new CreditLimitDataSource(this.salesService);
    this.dataSource.loadItems();
  }

  navigateBack() {
    this.location.back();
  }

  async updateCreditLimitDialog(row?) {
    const defaultCompany = await this.storage.getItem(DEFAULT_COMPANY);
    const creditLimits: { credit_limit: number; company: string }[] =
      row.credit_limits || [];
    let creditLimit = 0;

    for (const limit of creditLimits) {
      if (limit.company === defaultCompany) {
        creditLimit = limit.credit_limit;
      }
    }

    const popover = await this.popoverController.create({
      component: UpdateCreditLimitComponent,
      componentProps: {
        uuid: row.uuid,
        customer: row.name,
        baseCreditLimit: row.baseCreditLimitAmount || 0,
        currentCreditLimit: creditLimit,
        expiryDate: row.tempCreditLimitPeriod,
      },
    });
    popover.onDidDismiss().then(() => {
      this.dataSource.loadItems();
    });
    return await popover.present();
  }

  setFilter(event?) {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }
}
