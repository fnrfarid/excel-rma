import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViewWarrantyClaimsPage } from './view-warranty-claims.page';
import { Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
describe('ViewWarrantyClaimsPage', () => {
  let component: ViewWarrantyClaimsPage;
  let fixture: ComponentFixture<ViewWarrantyClaimsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewWarrantyClaimsPage],
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewWarrantyClaimsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
