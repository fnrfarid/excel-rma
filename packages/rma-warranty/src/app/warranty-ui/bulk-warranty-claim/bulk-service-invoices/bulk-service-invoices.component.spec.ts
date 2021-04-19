import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BulkServiceInvoicesComponent } from './bulk-service-invoices.component';

describe('BulkServiceInvoicesComponent', () => {
  let component: BulkServiceInvoicesComponent;
  let fixture: ComponentFixture<BulkServiceInvoicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BulkServiceInvoicesComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkServiceInvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
