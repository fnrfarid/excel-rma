import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { ViewSalesInvoicePage } from './view-sales-invoice.page';
import { Router } from '@angular/router';

describe('ViewSalesInvoicePage', () => {
  let component: ViewSalesInvoicePage;
  let fixture: ComponentFixture<ViewSalesInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewSalesInvoicePage],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: { sales_invoice_name: 'SINV-00420' } },
            }),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSalesInvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
