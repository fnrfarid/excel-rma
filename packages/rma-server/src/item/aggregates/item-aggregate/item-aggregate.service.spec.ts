import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from '../../entity/item/item.service';
import { ItemAggregateService } from './item-aggregate.service';
describe('ItemAggregateService', () => {
  let service: ItemAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemAggregateService,
        {
          provide: ItemService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ItemAggregateService>(ItemAggregateService);
  });
  ItemAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
