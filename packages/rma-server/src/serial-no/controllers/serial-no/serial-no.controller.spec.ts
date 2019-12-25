import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoController } from './serial-no.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenGuard } from '../../../auth/guards/token.guard';

describe('SerialNo Controller', () => {
  let controller: SerialNoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SerialNoController],
      providers: [
        {
          provide: CommandBus,
          useValue: {},
        },
        {
          provide: QueryBus,
          useValue: {},
        },
      ],
    })
      .overrideGuard(TokenGuard)
      .useValue({})
      .compile();

    controller = module.get<SerialNoController>(SerialNoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
