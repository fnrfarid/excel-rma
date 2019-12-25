import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoPoliciesService } from './serial-no-policies.service';

describe('SerialNoPoliciesService', () => {
  let service: SerialNoPoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerialNoPoliciesService],
    }).compile();

    service = module.get<SerialNoPoliciesService>(SerialNoPoliciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
