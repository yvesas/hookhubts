import request from 'supertest';
import app from '../app';

describe('Sanity Check', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/events should return 200 OK (empty list initially or seeded)', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('POST /webhooks/ingest should fail without key', async () => {
    const res = await request(app).post('/webhooks/ingest').send({});
    expect(res.status).toBe(401);
  });
});
