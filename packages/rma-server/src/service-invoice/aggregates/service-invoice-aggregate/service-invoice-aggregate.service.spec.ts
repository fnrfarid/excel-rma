import { Test, TestingModule } from '@nestjs/testing';
import { ServiceInvoiceAggregateService } from './service-invoice-aggregate.service';
import { ServiceInvoiceService } from '../../entity/service-invoice/service-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { HttpService } from '@nestjs/common';

describe('ServiceInvoiceAggregateService', () => {
  let service: ServiceInvoiceAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceInvoiceAggregateService,
        {
          provide: ServiceInvoiceService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ServiceInvoiceAggregateService>(
      ServiceInvoiceAggregateService,
    );
  });
  ServiceInvoiceAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
