import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsComponent } from './details.component';
import { MaterialModule } from '../../../material/material.module';
import { SalesService } from '../../services/sales.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';

describe('DetailsComponent', () => {
  let component: DetailsComponent;
  let fixture: ComponentFixture<DetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetailsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        MaterialModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
        BrowserAnimationsModule,
      ],
      providers: [
        {
          provide: SalesService,
          useValue: {
            getItemList: () => of({}),
            submitSalesInvoice: (...args) => of({}),
            getSalesInvoice: (...args) => of({}),
          },
        },
        {
          provide: Location,
          useValue: {},
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
