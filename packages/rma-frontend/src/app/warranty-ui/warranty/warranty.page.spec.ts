import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WarrantyPage } from './warranty.page';
import { MaterialModule } from '../../material/material.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('WarrantyPage', () => {
  let component: WarrantyPage;
  let fixture: ComponentFixture<WarrantyPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WarrantyPage],
      imports: [
        IonicModule.forRoot(),
        MaterialModule,
        FormsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WarrantyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
