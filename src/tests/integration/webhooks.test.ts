import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('Webhook Ingestion Integration', () => {
    let providerId: string;
    let apiKey: string;

    beforeAll(async () => {
        // Find existing MessageFlow provider or create if missing (it should exist from seed)
        let providerRes = await pool.query("SELECT id FROM providers WHERE name = $1", ['MessageFlow']);
        
        if (providerRes.rows.length === 0) {
             providerRes = await pool.query(
                "INSERT INTO providers (name, description) VALUES ($1, $2) RETURNING id",
                ['MessageFlow', 'Test Provider']
            );
        }
        providerId = providerRes.rows[0].id;

        const crypto = require('crypto');
        const secret = 'sk_test_' + crypto.randomBytes(8).toString('hex');
        const hash = crypto.createHash('sha256').update(secret).digest('hex');

        await pool.query(
            "INSERT INTO api_keys (provider_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)",
            [providerId, hash, 'sk_test', 'Test Key']
        );
        apiKey = secret;
    });

    afterAll(async () => {
        // Cleanup
        if (providerId) {
             // Clean up events created during tests
             await pool.query("DELETE FROM events WHERE provider_id = $1 AND external_event_id LIKE 'evt_test_%'", [providerId]);
             await pool.query("DELETE FROM events WHERE provider_id = $1 AND external_event_id LIKE 'evt_duplicate_%'", [providerId]);
             // Do NOT delete the provider as it might be shared
        }
    });

    it('should reject requests without API key', async () => {
        const res = await request(app).post('/webhooks/ingest').send({});
        expect(res.status).toBe(401);
    });

    it('should reject requests with invalid API key', async () => {
        const res = await request(app)
            .post('/webhooks/ingest')
            .set('X-API-Key', 'invalid_key')
            .send({});
        expect(res.status).toBe(401);
    });

    it('should ingest a valid payload successfully', async () => {
        const payload = {
            id: 'evt_test_' + Date.now(),
            type: 'message.inbound',
            created_at: new Date().toISOString(),
            data: { 
                sender: { id: 'usr_1', name: 'Test' },
                recipient: { id: 'usr_2' },
                content: { type: 'text', body: 'Hello' }
            }
        };

        const res = await request(app)
            .post('/webhooks/ingest')
            .set('X-API-Key', apiKey)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('success');

        // Verify in DB
        const dbRes = await pool.query("SELECT * FROM events WHERE id = $1", [res.body.id]);
        expect(dbRes.rows).toHaveLength(1);
        expect(dbRes.rows[0].provider_id).toBe(providerId);
    });

    it('should handle idempotency (duplicate event)', async () => {
        const payload = {
            id: 'evt_duplicate_' + Date.now(),
            type: 'test_event',
            created_at: new Date().toISOString(),
            data: { duplicate: true }
        };

        // First request
        const res1 = await request(app)
            .post('/webhooks/ingest')
            .set('X-API-Key', apiKey)
            .send(payload);
        expect(res1.status).toBe(201);

        // Second request (same payload/ID)
        const res2 = await request(app)
            .post('/webhooks/ingest')
            .set('X-API-Key', apiKey)
            .send(payload);
        
        // Should be 200 OK (idempotent success) but message differs
        expect(res2.status).toBe(200);
        expect(res2.body.message).toContain('duplicate');
    });
});
