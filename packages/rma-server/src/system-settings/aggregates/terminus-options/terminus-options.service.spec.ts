import { Test, TestingModule } from '@nestjs/testing';
import { TerminusOptionsService } from './terminus-options.service';
import { ConfigService } from '../../../config/config.service';
import { MicroserviceHealthIndicator } from '@nestjs/terminus';

describe('TerminusOptionsService', () => {
  let service: TerminusOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminusOptionsService,
        { provide: MicroserviceHealthIndicator, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<TerminusOptionsService>(TerminusOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
