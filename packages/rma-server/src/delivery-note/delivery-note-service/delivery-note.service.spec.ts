import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNoteService } from './delivery-note.service';
import { SettingsService } from '../../system-settings/aggregates/settings/settings.service';
import { HttpService } from '@nestjs/common';

describe('DeliveryNoteService', () => {
  let service: DeliveryNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryNoteService,
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

    service = module.get<DeliveryNoteService>(DeliveryNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
