import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSalesInvoicePage } from './add-sales-invoice.page';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../material/material.module';
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SalesInvoice } from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { STORAGE_TOKEN } from '../../api/storage/storage.service';

describe('AddSalesInvoicePage', () => {
  let component: AddSalesInvoicePage;
  let fixture: ComponentFixture<AddSalesInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSalesInvoicePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: SalesInvoice,
          useValue: {
            createSalesInvoice: (...args) => of({}),
            getSalesInvoice: (...args) => of({}),
          },
        },
        { provide: STORAGE_TOKEN, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSalesInvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
