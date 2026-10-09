const request = require('supertest');
const app = require('../../src/app');

describe('health & basics (no DB required)', () => {
  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'awaaz-backend' });
  });

  test('unknown routes return structured 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('GET /api/meta exposes constants for the frontend', async () => {
    const res = await request(app).get('/api/meta');
    expect(res.status).toBe(200);
    expect(res.body.data.statuses).toEqual(['REPORTED', 'ASSIGNED', 'RESOLVED']);
  });
});