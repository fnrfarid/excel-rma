import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { empty } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { SettingsPage } from './settings.page';
import { SettingsService } from './settings.service';
import { MaterialModule } from '../material/material.module';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule,
      ],
      declarations: [SettingsPage],
      providers: [
        { provide: Location, useValue: {} },
        {
          provide: SettingsService,
          useValue: {
            relayCompaniesOperation: (...args) => switchMap(res => empty()),
            relaySellingPriceListsOperation: (...args) =>
              switchMap(res => empty()),
            getSettings: (...args) => empty(),
          },
        },
        { provide: ToastController, useValue: {} },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
