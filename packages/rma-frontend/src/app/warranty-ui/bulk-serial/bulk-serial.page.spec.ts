import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BulkSerialPage } from './bulk-serial.page';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material/material.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('BulkSerialPage', () => {
  let component: BulkSerialPage;
  let fixture: ComponentFixture<BulkSerialPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BulkSerialPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [RouterTestingModule, MaterialModule],
      providers: [
        {
          provide: MatSnackBar,
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
    fixture = TestBed.createComponent(BulkSerialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
