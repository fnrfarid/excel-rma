import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddWarrantyClaimPage } from './add-warranty-claim.page';

describe('AddWarrantyClaimPage', () => {
  let component: AddWarrantyClaimPage;
  let fixture: ComponentFixture<AddWarrantyClaimPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddWarrantyClaimPage],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddWarrantyClaimPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
