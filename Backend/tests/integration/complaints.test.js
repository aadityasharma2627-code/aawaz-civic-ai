const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { initDb, resetDb } = require('../setup');

beforeAll(async () => { await initDb(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await db.end(); });

describe('POST /api/complaints — creation & classification', () => {
  test('creates a complaint from a Hinglish pothole report', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .send({ text: 'Sector 22 mein road par bada gadda hai', language: 'hi', sector: 'Sector 22' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.complaint.id).toMatch(/^AWZ-\d{4}$/);
    expect(res.body.complaint.category).toBe('pothole');
    expect(res.body.complaint.department).toBe('MC Roads');
    expect(res.body.complaint.status).toBe('REPORTED');
    expect(res.body.complaint.report_count).toBe(1);
    expect(res.body.complaint.priority).toBe('HIGH');
    expect(typeof res.body.complaint.description).toBe('string');
    expect(res.body.complaint.language).toBe('hi');
  });

  test('rejects empty complaint text', async () => {
    const res = await request(app).post('/api/complaints').send({ text: '   ', sector: 'Sector 22' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.message).toBe('Complaint text is required.');
  });

  test('rejects a missing/malformed sector', async () => {
    const res = await request(app).post('/api/complaints').send({ text: 'gaddha hai' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('sector');
  });

  test('rejects an invalid manually-supplied category', async () => {
    const res = await request(app).post('/api/complaints')
      .send({ text: 'something wrong', sector: 'Sector 22', category: 'explosion' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid category');
  });

  test('rejects invalid coordinates', async () => {
    const res = await request(app).post('/api/complaints')
      .send({ text: 'gaddha hai', sector: 'Sector 22', latitude: 999 });
    expect(res.status).toBe(400);
  });

  test('accepts optional photo + coordinates and stores them', async () => {
    const res = await request(app).post('/api/complaints').send({
      text: 'Street light sparking near school',
      sector: 'Sector 21',
      latitude: 30.7333,
      longitude: 76.7794,
      photo: 'https://example.com/light.jpg',
    });
    expect(res.status).toBe(201);
    expect(res.body.complaint.photo_url).toBe('https://example.com/light.jpg');
    expect(res.body.complaint.latitude).toBeCloseTo(30.7333);
  });

  test('classifies garbage (Punjabi) → MC Sanitation', async () => {
    const res = await request(app).post('/api/complaints')
      .send({ text: 'Sector 35 vich kooda bahut jama hai', sector: 'Sector 35' });
    expect(res.body.complaint.category).toBe('garbage');
    expect(res.body.complaint.department).toBe('MC Sanitation');
    expect(res.body.complaint.language).toBe('hinglish'); // auto-detected (romanized)
  });

  test('classifies streetlight (English) with school priority bump → Electricity Dept', async () => {
    const res = await request(app).post('/api/complaints')
      .send({ text: 'There is a broken street light near the school', sector: 'Sector 21' });
    expect(res.body.complaint.category).toBe('streetlight');
    expect(res.body.complaint.department).toBe('Electricity Dept');
    expect(res.body.complaint.priority).toBe('MEDIUM'); // 40 + 25
  });

  test('classifies water leak (Hinglish) → Water Supply', async () => {
    const res = await request(app).post('/api/complaints')
      .send({ text: 'Sector 43 mein paani leak ho raha hai', sector: 'Sector 43' });
    expect(res.body.complaint.category).toBe('water_leak');
    expect(res.body.complaint.department).toBe('Water Supply');
  });
});

describe('duplicate detection', () => {
  test('merges same category + sector and increments report_count', async () => {
    await request(app).post('/api/complaints')
      .send({ text: 'Sector 22 mein bada gadda hai', sector: 'Sector 22' });
    const second = await request(app).post('/api/complaints')
      .send({ text: 'Sector 22 mein sadak par gaddha hai', sector: 'sector 22' }); // note: different casing

    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.complaint.id).toBe('AWZ-0001');
    expect(second.body.complaint.report_count).toBe(2);
  });

  test('does NOT merge complaints from different sectors', async () => {
    await request(app).post('/api/complaints').send({ text: 'Sector 22 mein gaddha hai', sector: 'Sector 22' });
    const other = await request(app).post('/api/complaints').send({ text: 'Sector 35 mein gaddha hai', sector: 'Sector 35' });
    expect(other.body.duplicate).toBe(false);
    expect(other.body.complaint.id).toBe('AWZ-0002');
  });

  test('allows a new complaint after the old one is RESOLVED', async () => {
    await request(app).post('/api/complaints').send({ text: 'Sector 22 mein gaddha hai', sector: 'Sector 22' });
    await request(app).patch('/api/complaints/AWZ-0001/status').send({ status: 'RESOLVED' });
    const fresh = await request(app).post('/api/complaints')
      .send({ text: 'Sector 22 mein phir gaddha ban gaya hai', sector: 'Sector 22' });
    expect(fresh.body.duplicate).toBe(false);
    expect(fresh.body.complaint.id).toBe('AWZ-0002');
  });
});

describe('status management', () => {
  test('updates status, records history and returns the complaint', async () => {
    await request(app).post('/api/complaints').send({ text: 'Sector 22 mein gaddha hai', sector: 'Sector 22' });

    const res = await request(app).patch('/api/complaints/AWZ-0001/status')
      .send({ status: 'ASSIGNED', changed_by: 'admin_ravi' });
    expect(res.status).toBe(200);
    expect(res.body.data.complaint.status).toBe('ASSIGNED');

    const detail = await request(app).get('/api/complaints/AWZ-0001');
    expect(detail.body.data.complaint.status).toBe('ASSIGNED');
    expect(detail.body.data.status_history).toHaveLength(2);
    expect(detail.body.data.status_history[0]).toMatchObject({ status: 'REPORTED', changed_by: 'system' });
    expect(detail.body.data.status_history[1]).toMatchObject({ status: 'ASSIGNED', changed_by: 'admin_ravi' });
  });

  test('rejects an invalid status', async () => {
    await request(app).post('/api/complaints').send({ text: 'Sector 22 mein gaddha hai', sector: 'Sector 22' });
    const res = await request(app).patch('/api/complaints/AWZ-0001/status').send({ status: 'DONE' });
    expect(res.status).toBe(400);
  });

  test('404s for an unknown complaint', async () => {
    const res = await request(app).patch('/api/complaints/AWZ-9999/status').send({ status: 'ASSIGNED' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/complaints — listing & filters', () => {
  test('supports status/priority/category/sector filters', async () => {
    await request(app).post('/api/complaints').send({ text: 'Sector 22 mein bada gadda hai', sector: 'Sector 22' });   // HIGH pothole
    await request(app).post('/api/complaints').send({ text: 'Sector 35 vich kooda hai', sector: 'Sector 35' });          // LOW garbage

    const res = await request(app).get('/api/complaints?status=REPORTED&priority=HIGH');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.complaints[0].category).toBe('pothole');

    const bySector = await request(app).get('/api/complaints?sector=Sector%2035');
    expect(bySector.body.data.total).toBe(1);
    expect(bySector.body.data.complaints[0].category).toBe('garbage');
  });

  test('rejects invalid filter values', async () => {
    const res = await request(app).get('/api/complaints?priority=URGENT');
    expect(res.status).toBe(400);
  });
});