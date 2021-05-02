import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ServiceInvoicesPage } from './service-invoices.page';

describe('ServiceInvoicePage', () => {
  let component: ServiceInvoicesPage;
  let fixture: ComponentFixture<ServiceInvoicesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceInvoicesPage ],
      imports: [IonicModule.forRoot(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceInvoicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
