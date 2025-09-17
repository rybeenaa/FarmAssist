import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('CropsModule (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    // Close DB connection if present to avoid open handles
    try {
      const ds = app.get(DataSource, { strict: false });
      await ds?.destroy();
    } catch {}
    await app.close();
  });

  it('POST /crops creates and GET /crops lists', async () => {
    const createRes = await request(httpServer)
      .post('/crops')
      .send({
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        plantingSeasons: ['spring'],
        growthCycleDays: 90,
        commonDiseases: ['blight'],
        idealSoilTypes: ['loam'],
        waterRequirement: 'MEDIUM',
        sunlightRequirement: 'FULL_SUN',
        regionSuitability: ['temperate'],
        notes: 'Popular crop',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');

    const listRes = await request(httpServer).get('/crops').expect(200);
    expect(listRes.body).toHaveProperty('data');
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });
});


