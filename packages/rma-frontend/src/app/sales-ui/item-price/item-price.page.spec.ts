import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ItemPricePage } from './item-price.page';
import { MaterialModule } from '../../material/material.module';
import { ItemPriceService } from '../services/item-price.service';

@Pipe({ name: 'curFormat' })
class MockPipe implements PipeTransform {
  transform(value: any, ...args: any[]) {}
}

describe('ItemPricePage', () => {
  let component: ItemPricePage;
  let fixture: ComponentFixture<ItemPricePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ItemPricePage, MockPipe],
      imports: [
        MaterialModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ItemPriceService, useValue: {} },
        { provide: Location, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPricePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
