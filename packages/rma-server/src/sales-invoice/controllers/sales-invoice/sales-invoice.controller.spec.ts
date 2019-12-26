import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceController } from './sales-invoice.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenCacheService } from '../../../auth/entities/token-cache/token-cache.service';
import { HttpService } from '@nestjs/common';
import { TokenGuard } from '../../../auth/guards/token.guard';

describe('SalesInvoice Controller', () => {
  let controller: SalesInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesInvoiceController],
      providers: [
        {
          provide: CommandBus,
          useValue: {},
        },
        {
          provide: QueryBus,
          useValue: {},
        },
        {
          provide: TokenCacheService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(TokenGuard)
      .useValue({})
      .compile();

    controller = module.get<SalesInvoiceController>(SalesInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
