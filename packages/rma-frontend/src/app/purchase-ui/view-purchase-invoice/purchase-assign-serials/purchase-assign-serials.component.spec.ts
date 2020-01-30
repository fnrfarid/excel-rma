import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PurchaseAssignSerialsComponent } from './purchase-assign-serials.component';

describe('PurchaseAssignSerialsComponent', () => {
  let component: PurchaseAssignSerialsComponent;
  let fixture: ComponentFixture<PurchaseAssignSerialsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PurchaseAssignSerialsComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseAssignSerialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
