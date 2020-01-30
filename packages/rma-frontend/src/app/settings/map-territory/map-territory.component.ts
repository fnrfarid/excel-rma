import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MapTerritoryService } from './map-territory.service';
import { Observable } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';
import { PopoverController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-map-territory',
  templateUrl: './map-territory.component.html',
  styleUrls: ['./map-territory.component.scss'],
})
export class MapTerritoryComponent implements OnInit {
  territoryForm = new FormGroup({
    territory: new FormControl(),
    warehouse: new FormControl(),
  });

  territories: Observable<unknown[]> = this.territoryForm
    .get('territory')
    .valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      this.mapTerritory.relayTerritories(),
    );

  warehouses: Observable<unknown[]> = this.territoryForm
    .get('warehouse')
    .valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      this.mapTerritory.relayWarehouses(),
    );

  editTerritory: boolean = false;
  createTerritory: boolean = false;
  uuid: string;

  constructor(
    private readonly mapTerritory: MapTerritoryService,
    private readonly popoverCtrl: PopoverController,
    private readonly navParams: NavParams,
  ) {}

  ngOnInit() {
    const territory = this.navParams.data.territory;
    const warehouse = this.navParams.data.warehouse;
    this.uuid = this.navParams.data.uuid;
    this.editTerritory = this.uuid && territory && warehouse ? true : false;
    this.createTerritory = this.uuid && territory && warehouse ? false : true;
    this.territoryForm.get('territory').setValue(territory);
    this.territoryForm.get('warehouse').setValue(warehouse);
  }

  async onCancel() {
    return await this.popoverCtrl.dismiss();
  }

  onUpdate() {
    this.mapTerritory
      .update(
        this.uuid,
        this.territoryForm.get('territory').value,
        this.territoryForm.get('warehouse').value,
      )
      .subscribe({
        next: res => {
          this.popoverCtrl.dismiss().then(dismissed => {});
        },
        error: error => {},
      });
  }

  onCreate() {
    this.mapTerritory
      .create(
        this.territoryForm.get('territory').value,
        this.territoryForm.get('warehouse').value,
      )
      .subscribe({
        next: res => {
          this.popoverCtrl.dismiss().then(dismissed => {});
        },
        error: error => {},
      });
  }

  onDelete() {
    this.mapTerritory.delete(this.uuid).subscribe({
      next: res => {
        this.popoverCtrl.dismiss().then(dismissed => {});
      },
      error: error => {},
    });
  }
}