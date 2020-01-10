import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNoteController } from './delivery-note.controller';
import { DeliveryNoteService } from '../delivery-note-service/delivery-note.service';
import { TokenGuard } from '../../auth/guards/token.guard';

describe('DeliveryNote Controller', () => {
  let controller: DeliveryNoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryNoteController],
      providers: [
        {
          provide: DeliveryNoteService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(TokenGuard)
      .useValue({})
      .compile();

    controller = module.get<DeliveryNoteController>(DeliveryNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
