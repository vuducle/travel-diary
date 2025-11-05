import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

describe('EntriesController', () => {
  let controller: EntriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: {
            findManyForUser: jest.fn(),
            findTripLocationsWithEntries: jest.fn(),
            findOneForUser: jest.fn(),
            create: jest.fn(),
            updateForUser: jest.fn(),
            removeForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
