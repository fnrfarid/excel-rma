import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SalesReturnPage } from './sales-return.page';
import { MaterialModule } from '../../material/material.module';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';
import { of } from 'rxjs';

describe('SalesReturnPage', () => {
  let component: SalesReturnPage;
  let fixture: ComponentFixture<SalesReturnPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SalesReturnPage],
      imports: [
        IonicModule.forRoot(),
        MaterialModule,
        FormsModule,
        BrowserAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: SalesReturnService,
          useValue: {
            getSalesReturnList: (...args) => of([{}]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesReturnPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
