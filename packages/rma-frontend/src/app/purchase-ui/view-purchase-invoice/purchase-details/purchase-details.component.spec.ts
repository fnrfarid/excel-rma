import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PurchaseDetailsComponent } from './purchase-details.component';
import { MaterialModule } from '../../../material/material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'curFormat' })
class MockPipe implements PipeTransform {
  transform(value: string) {
    return value;
  }
}

describe('PurchaseDetailsComponent', () => {
  let component: PurchaseDetailsComponent;
  let fixture: ComponentFixture<PurchaseDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PurchaseDetailsComponent, MockPipe],
      imports: [IonicModule.forRoot(), MaterialModule, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
