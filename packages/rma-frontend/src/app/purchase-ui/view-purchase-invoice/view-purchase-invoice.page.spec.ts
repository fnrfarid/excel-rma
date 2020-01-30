import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViewPurchaseInvoicePage } from './view-purchase-invoice.page';
import { Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ViewPurchaseInvoicePage', () => {
  let component: ViewPurchaseInvoicePage;
  let fixture: ComponentFixture<ViewPurchaseInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewPurchaseInvoicePage],
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPurchaseInvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
