import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoAggregateService } from './serial-no-aggregate.service';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoPoliciesService } from '../../policies/serial-no-policies/serial-no-policies.service';
import { AssignSerialNoPoliciesService } from '../../policies/assign-serial-no-policies/assign-serial-no-policies.service';
import { DeliveryNoteAggregateService } from '../../../delivery-note/aggregates/delivery-note-aggregate/delivery-note-aggregate.service';
describe('SerialNoAggregateService', () => {
  let service: SerialNoAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialNoAggregateService,
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: SerialNoPoliciesService,
          useValue: {},
        },
        {
          provide: AssignSerialNoPoliciesService,
          useValue: {},
        },
        {
          provide: DeliveryNoteAggregateService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SerialNoAggregateService>(SerialNoAggregateService);
  });
  SerialNoAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
