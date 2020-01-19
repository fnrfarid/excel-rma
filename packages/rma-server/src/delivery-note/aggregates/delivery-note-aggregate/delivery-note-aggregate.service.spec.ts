import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/common';
import { DeliveryNoteAggregateService } from './delivery-note-aggregate.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';

describe('DeliveryNoteAggregateService', () => {
  let service: DeliveryNoteAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryNoteAggregateService,
        { provide: SettingsService, useValue: {} },
        { provide: HttpService, useValue: {} },
        { provide: ClientTokenManagerService, useValue: {} },
      ],
    }).compile();

    service = module.get<DeliveryNoteAggregateService>(
      DeliveryNoteAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
