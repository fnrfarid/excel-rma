import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { SettingsService } from './settings.service';
import { startWith, debounceTime } from 'rxjs/operators';
import { ToastController, PopoverController } from '@ionic/angular';
import {
  SHORT_DURATION,
  UPDATE_SUCCESSFUL,
  UPDATE_ERROR,
} from '../constants/app-string';
import { MatPaginator, MatSort } from '@angular/material';
import { TerritoryDataSource } from './territory-datasource';
import { MapTerritoryComponent } from './map-territory/map-territory.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  hideSASecret: boolean = true;

  companySettingsForm = new FormGroup({
    authServerURL: new FormControl(),
    appURL: new FormControl(),
    defaultCompany: new FormControl(),
    frontendClientId: new FormControl(),
    backendClientId: new FormControl(),
    serviceAccountUser: new FormControl(),
    serviceAccountSecret: new FormControl(),
    sellingPriceList: new FormControl(),
    timeZone: new FormControl(),
    validateStock: new FormControl(),
  });

  companies: Observable<unknown[]> = this.companySettingsForm
    .get('defaultCompany')
    .valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      this.service.relayCompaniesOperation(),
    );

  sellingPriceLists: Observable<unknown[]> = this.companySettingsForm
    .get('sellingPriceList')
    .valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      this.service.relaySellingPriceListsOperation(),
    );

  timezones: Observable<unknown[]> = this.companySettingsForm
    .get('timeZone')
    .valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      this.service.relayTimeZoneOperation(),
    );

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  territoryDataSource: TerritoryDataSource;

  displayedColumns = ['name', 'warehouse'];
  search: string = '';

  constructor(
    private readonly location: Location,
    private readonly service: SettingsService,
    private readonly toastController: ToastController,
    private readonly popoverController: PopoverController,
  ) {}

  ngOnInit() {
    this.service.getSettings().subscribe({
      next: res => {
        this.companySettingsForm
          .get('authServerURL')
          .setValue(res.authServerURL);
        this.companySettingsForm.get('appURL').setValue(res.appURL);
        this.companySettingsForm
          .get('defaultCompany')
          .setValue(res.defaultCompany);
        this.companySettingsForm
          .get('frontendClientId')
          .setValue(res.frontendClientId);
        this.companySettingsForm
          .get('backendClientId')
          .setValue(res.backendClientId);
        this.companySettingsForm
          .get('serviceAccountUser')
          .setValue(res.serviceAccountUser);
        this.companySettingsForm
          .get('serviceAccountSecret')
          .setValue(res.serviceAccountSecret);
        this.companySettingsForm
          .get('sellingPriceList')
          .setValue(res.sellingPriceList);
        this.companySettingsForm.get('timeZone').setValue(res.timeZone);
        this.companySettingsForm
          .get('validateStock')
          .setValue(res.validateStock);
      },
    });

    this.territoryDataSource = new TerritoryDataSource(this.service);
    this.territoryDataSource.loadItems();
  }

  navigateBack() {
    this.location.back();
  }

  updateSettings() {
    this.service
      .updateSettings(
        this.companySettingsForm.get('authServerURL').value,
        this.companySettingsForm.get('appURL').value,
        this.companySettingsForm.get('defaultCompany').value,
        this.companySettingsForm.get('frontendClientId').value,
        this.companySettingsForm.get('backendClientId').value,
        this.companySettingsForm.get('serviceAccountUser').value,
        this.companySettingsForm.get('serviceAccountSecret').value,
        this.companySettingsForm.get('sellingPriceList').value,
        this.companySettingsForm.get('timeZone').value,
        this.companySettingsForm.get('validateStock').value,
      )
      .subscribe({
        next: success => {
          this.toastController
            .create({
              message: UPDATE_SUCCESSFUL,
              duration: SHORT_DURATION,
              showCloseButton: true,
            })
            .then(toast => toast.present());
        },
        error: error => {
          this.toastController
            .create({
              message: UPDATE_ERROR,
              duration: SHORT_DURATION,
              showCloseButton: true,
            })
            .then(toast => toast.present());
        },
      });
  }

  getUpdate(event) {
    this.territoryDataSource.loadItems(
      this.search,
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }

  setFilter() {
    this.territoryDataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }

  async mapTerritory(uuid?: string, territory?: string, warehouse?: string) {
    const popover = await this.popoverController.create({
      component: MapTerritoryComponent,
      componentProps: { uuid, territory, warehouse },
    });
    popover.onDidDismiss().then(() => {
      this.territoryDataSource.loadItems();
    });
    return await popover.present();
  }
}
