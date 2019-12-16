import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServerSettings } from './server-settings.entity';
import { ServerSettingsService } from './server-settings.service';

describe('ServerSettingsService', () => {
  let service: ServerSettingsService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerSettingsService,
        {
          provide: getRepositoryToken(ServerSettings),
          useValue: {}, // provide mock values
        },
      ],
    }).compile();
    service = module.get<ServerSettingsService>(ServerSettingsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
