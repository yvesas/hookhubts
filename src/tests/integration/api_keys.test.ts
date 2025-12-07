import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('API Keys Integration', () => {
    let providerId: string;
    let createdKeyId: string;

    beforeAll(async () => {
        const providerRes = await pool.query(
            "INSERT INTO providers (name, description) VALUES ($1, $2) RETURNING id",
            ['KeyTestProvider_' + Date.now(), 'Key Test Provider']
        );
        providerId = providerRes.rows[0].id;
    });

    afterAll(async () => {
        if (createdKeyId) {
            await pool.query("DELETE FROM api_keys WHERE id = $1", [createdKeyId]);
        }
        if (providerId) {
            await pool.query("DELETE FROM providers WHERE id = $1", [providerId]);
        }
    });

    it('should create an API key', async () => {
        const res = await request(app)
            .post('/api/keys')
            .send({
                providerId: providerId,
                name: 'Test Key'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('secret');
        expect(res.body.key_prefix).toBeDefined();
        expect(res.body.is_active).toBe(true);

        createdKeyId = res.body.id;
    });

    it('should list API keys', async () => {
        // Test listing by provider
        const res = await request(app).get(`/api/keys?providerId=${providerId}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1); // The one we created

        const key = res.body.find((k: any) => k.id === createdKeyId);
        expect(key).toBeDefined();
        expect(key.token).toContain('...'); // Masked
        expect(key.provider_name).toBeDefined();
    });

    it('should list all API keys (no provider filter)', async () => {
        const res = await request(app).get('/api/keys');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should revoke an API key', async () => {
        const res = await request(app).delete(`/api/keys/${createdKeyId}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('revoked');

        // Verify in DB
        const dbRes = await pool.query("SELECT is_active, revoked_at FROM api_keys WHERE id = $1", [createdKeyId]);
        expect(dbRes.rows[0].is_active).toBe(false);
        expect(dbRes.rows[0].revoked_at).not.toBeNull();
    });
});
