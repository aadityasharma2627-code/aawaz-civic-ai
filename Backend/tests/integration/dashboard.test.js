const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { initDb, resetDb } = require('../setup');

beforeAll(async () => { await initDb(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await db.end(); });

async function seed() {
  await request(app).post('/api/complaints').send({ text: 'Sector 22 mein bada gadda hai', sector: 'Sector 22' });               // AWZ-0001 pothole HIGH
  await request(app).post('/api/complaints').send({ text: 'Sector 22 mein sadak par gaddha hai', sector: 'Sector 22' });           // duplicate → count 2
  await request(app).post('/api/complaints').send({ text: 'Sector 35 vich kooda hai', sector: 'Sector 35' });                      // AWZ-0002 garbage LOW
  await request(app).post('/api/complaints').send({ text: 'Sector 43 mein paani leak ho raha hai hospital ke paas', sector: 'Sector 43' }); // AWZ-0003 water HIGH
  await request(app).patch('/api/complaints/AWZ-0002/status').send({ status: 'RESOLVED' });
}

describe('GET /api/dashboard/stats', () => {
  test('returns aggregate statistics and all distributions', async () => {
    await seed();
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.total).toBe(3);
    expect(d.open).toBe(2);
    expect(d.resolved).toBe(1);
    expect(d.merged_reports).toBe(1);
    expect(d.high_priority).toBe(2);
    expect(d.category_distribution.find((x) => x.category === 'pothole').count).toBe(1);
    expect(d.status_distribution.find((x) => x.status === 'RESOLVED').count).toBe(1);
    expect(Array.isArray(d.department_distribution)).toBe(true);
    expect(Array.isArray(d.priority_distribution)).toBe(true);
  });
});

describe('GET /api/dashboard/hotspots', () => {
  test('returns sector-wise open complaint counts', async () => {
    await seed();
    const res = await request(app).get('/api/dashboard/hotspots');
    expect(res.status).toBe(200);
    const hotspots = res.body.data.hotspots;
    expect(hotspots).toHaveLength(2);
    expect(hotspots[0]).toEqual({ sector: 'Sector 22', open_complaints: 1 });
  });
});