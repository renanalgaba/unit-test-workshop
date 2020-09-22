import { Test, TestingModule } from '@nestjs/testing';
import { CatController } from './cat.controller';
import { CatService } from './cat.service';
import { CatAlreadyAdopted, CatNotFound, WrongCatBirthday } from './cat-errors';
import { OutOfStock } from '../whiskas/whiskas-errors';
import { CacheNotConnected } from '../cache/cache-errors';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MockExpressResponse = require('mock-express-response');
//  npm install mock-express-response --save-dev

// jest.fn().mockResolvedValue('thomas') === jest.fn().mockImplementation(() => Promise.resolve('thomas'))

const CatServiceMock = jest.fn().mockImplementation(() => ({
  getFoodForCat: jest.fn().mockResolvedValue({
    message: 'Corsinha está satisfeito :)',
  }),
  adoptKitty: jest.fn().mockResolvedValue({
    message: 'Congratulations! cat has been succesfully adopted!',
  }),
  celebrateKitty: jest.fn().mockResolvedValue({
    message: 'Happy Birthday!',
  }),
}));

describe('Cat Controller', () => {
  let controller: CatController;
  let catService: CatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatController],
      providers: [
        {
          provide: 'CatService',
          useFactory: () => new CatServiceMock(),
        },
      ],
    }).compile();

    controller = module.get<CatController>(CatController);
    catService = module.get<CatService>(CatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('feedCat', () => {
    it('should respond with http status 200 when succesful', async () => {
      expect.assertions(2);
      const response = new MockExpressResponse();

      await controller.feedCat('corsinha', response);

      expect(response.statusCode).toBe(200);
      expect(response._getJSON()).toStrictEqual({
        message: 'Corsinha está satisfeito :)',
      });
    });

    it('should call getFoodForCat correctly', async () => {
      expect.assertions(2);
      const serviceSpy = jest.spyOn(catService, 'getFoodForCat');

      const response = new MockExpressResponse();

      await controller.feedCat('corsinha', response);

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith('corsinha');
    });

    it('should respond with http status 404 when Cat is not Found', async () => {
      jest
        .spyOn(catService, 'getFoodForCat')
        .mockRejectedValue(new CatNotFound('corsinha'));

      const response = new MockExpressResponse();
      await controller.feedCat('corsinha', response);

      expect(response.statusCode).toBe(404);
      expect(response._getJSON()).toStrictEqual({
        message: "corsinha isn't here :( Maybe they haven't been adopted yet?",
      });
    });

    it('should respond with http status 404 when Out of Stock', async () => {
      jest
        .spyOn(catService, 'getFoodForCat')
        .mockRejectedValue(new OutOfStock('whiskas'));

      const response = new MockExpressResponse();
      await controller.feedCat('Ibizel', response);

      expect(response.statusCode).toBe(404);
      expect(response._getJSON()).toStrictEqual({
        message: "We're out of whiskas. Someone needs to go buy some more.",
      });
    });
    it('should respond with http status 502 when Cache not Found', async () => {
      jest
        .spyOn(catService, 'getFoodForCat')
        .mockRejectedValue(new CacheNotConnected());

      const response = new MockExpressResponse();
      await controller.feedCat('Ibizel', response);
      expect(response._getJSON()).toStrictEqual({
        message:
          "Sorry! It seems we're having some connection issues. Don't worry! Your cats will stay safe while we work on the problem.",
      });
    });

    it('should respond with http status 500 when Internal server error', async () => {
      jest
        .spyOn(catService, 'getFoodForCat')
        .mockRejectedValue(new Error('processing error'));

      const response = new MockExpressResponse();
      await controller.feedCat('corsinha', response);

      expect(response.statusCode).toBe(500);
      expect(response._getString()).toStrictEqual('processing error');
    });
  });

  describe('adoptCat', () => {
    const ibizel = {
      name: 'Ibizel',
      birth_date: '01/01/2015',
      age: 5,
      favorite_food: 'tears',
    };
    it('should respond with http status 201 when succesful', async () => {
      const response = new MockExpressResponse();

      await controller.adoptCat(ibizel, response);

      expect(response.statusCode).toBe(201);
      expect(response._getJSON()).toStrictEqual({
        message: 'Congratulations! cat has been succesfully adopted!',
      });
    });

    it('should call adoptKitty correctly', async () => {
      const serviceSpy = jest.spyOn(catService, 'adoptKitty');

      const response = new MockExpressResponse();

      await controller.adoptCat(ibizel, response);

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(ibizel);
    });

    it('should respond with http status 409 when cat is already adopted', async () => {
      jest
        .spyOn(catService, 'adoptKitty')
        .mockRejectedValue(new CatAlreadyAdopted('ibizel'));

      const response = new MockExpressResponse();
      await controller.adoptCat(ibizel, response);

      expect(response.statusCode).toBe(409);
      expect(response._getJSON()).toStrictEqual({
        message: "ibizel is already here. That means you can't adopt them!",
      });
    });
    it('should respond with http status 502 when cache is not connected', async () => {
      jest
        .spyOn(catService, 'adoptKitty')
        .mockRejectedValue(new CacheNotConnected());

      const response = new MockExpressResponse();
      await controller.adoptCat(ibizel, response);

      expect(response.statusCode).toBe(502);
      expect(response._getJSON()).toStrictEqual({
        message:
          "Sorry! It seems we're having some connection issues. Don't worry! Your cats will stay safe while we work on the problem.",
      });
    });
    it('should respond with http status 500 when Internal server error', async () => {
      jest.spyOn(catService, 'adoptKitty').mockRejectedValue('');

      const response = new MockExpressResponse();
      await controller.adoptCat(ibizel, response);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('celebrateCatBirthday', () => {
    const ibizel = {
      name: 'Ibizel',
      birth_date: '01/01/2015',
      age: 5,
      favorite_food: 'tears',
    };
    it('should respond with http status 201 when succesful', async () => {
      const response = new MockExpressResponse();

      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(response.statusCode).toBe(200);
      // expect(response._getJSON()).toStrictEqual({
      //   message: 'Congratulations! cat has been succesfully adopted!',
      // });
    });
    it('should call celebrateKitty function correctly', async () => {
      const celebrateSpy = jest.spyOn(catService, 'celebrateKitty');

      const response = new MockExpressResponse();

      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(celebrateSpy).toHaveBeenCalledTimes(1);
    });
    it('should respond with http status 401 when Birthday is wrong', async () => {
      jest
        .spyOn(catService, 'celebrateKitty')
        .mockRejectedValue(new WrongCatBirthday('ibizel'));

      const response = new MockExpressResponse();
      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(response.statusCode).toBe(401);
      expect(response._getJSON()).toStrictEqual({
        message:
          "That isn't ibizel's birthday. Your kitty will be sad if you can't remember their birthday.",
      });
    });
    it('should respond with http status 404 when Cat not found', async () => {
      jest
        .spyOn(catService, 'celebrateKitty')
        .mockRejectedValue(new CatNotFound('ibizel'));

      const response = new MockExpressResponse();
      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(response.statusCode).toBe(404);
      expect(response._getJSON()).toStrictEqual({
        message: "ibizel isn't here :( Maybe they haven't been adopted yet?",
      });
    });
    it('should respond with http status 500 when Internal Server Error', async () => {
      jest.spyOn(catService, 'celebrateKitty').mockRejectedValue('');

      const response = new MockExpressResponse();
      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(response.statusCode).toBe(500);
    });

    it('should respond with http status 502 when cache is not connected', async () => {
      jest
        .spyOn(catService, 'celebrateKitty')
        .mockRejectedValue(new CacheNotConnected());

      const response = new MockExpressResponse();
      await controller.celebrateCatBirthday('ibizel', ibizel, response);

      expect(response.statusCode).toBe(502);
      expect(response._getJSON()).toStrictEqual({
        message:
          "Sorry! It seems we're having some connection issues. Don't worry! Your cats will stay safe while we work on the problem.",
      });
    });
  });
});
