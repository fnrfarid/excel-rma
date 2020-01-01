import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { WarrantyClaimPage } from './warranty-claim.page';
import { MaterialModule } from '../../material/material.module';
import { RouterTestingModule } from '@angular/router/testing';
import { WarrantyService } from '../warranty/warranty.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('WarrantyClaimPage', () => {
  let component: WarrantyClaimPage;
  let fixture: ComponentFixture<WarrantyClaimPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WarrantyClaimPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        RouterTestingModule,
        MaterialModule,
        FormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        {
          provide: WarrantyService,
          useValue: {
            findModels: (...args) => of({}),
          },
        },
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: Router,
          useValue: {},
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarrantyClaimPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
