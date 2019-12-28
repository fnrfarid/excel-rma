import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { WarrantyPage } from './warranty.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '../../material/material.module';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { WarrantyService } from './warranty.service';
import { of } from 'rxjs';
import { Location } from '@angular/common';

describe('WarrantyPage', () => {
  let component: WarrantyPage;
  let fixture: ComponentFixture<WarrantyPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MaterialModule,
        RouterTestingModule,
        FormsModule,
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
      ],
      declarations: [WarrantyPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarrantyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
