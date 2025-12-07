import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('API Integration', () => {
    let providerId: string;

    beforeAll(async () => {
        // Seed data
        const providerRes = await pool.query(
            "INSERT INTO providers (name, description) VALUES ($1, $2) RETURNING id",
            ['API Test Provider', 'For API tests']
        );
        providerId = providerRes.rows[0].id;

        // Insert events with specific timestamps
        await pool.query(
            `INSERT INTO events (
                provider_id, external_event_id, event_type, timestamp, raw_payload
            ) VALUES 
            ($1, 'evt_1', 'type_a', NOW() - INTERVAL '1 hour', '{}'),
            ($1, 'evt_2', 'type_b', NOW() - INTERVAL '2 hours', '{}'),
            ($1, 'evt_3', 'type_a', NOW() - INTERVAL '3 hours', '{}')`,
            [providerId]
        );
    });

    afterAll(async () => {
        if (providerId) {
            await pool.query("DELETE FROM events WHERE provider_id = $1", [providerId]);
            await pool.query("DELETE FROM providers WHERE id = $1", [providerId]);
        }
    });

    describe('GET /api/events', () => {
        it('should list all events', async () => {
            const res = await request(app).get('/api/events');
            expect(res.status).toBe(200);
            expect(res.body.events.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter by event type', async () => {
            const res = await request(app).get('/api/events?eventType=type_a');
            expect(res.status).toBe(200);
            const events = res.body.events;
            // Should find at least the ones we inserted, assuming no others match 'type_a' or fine if others do
            // More robust: check that ALL returned events are type_a
            expect(events.length).toBeGreaterThan(0);
            events.forEach((evt: any) => {
                expect(evt.event_type).toBe('type_a');
            });
        });

        it('should filter by provider', async () => {
            const res = await request(app).get(`/api/events?providerId=${providerId}`);
            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(3);
        });

        it('should support pagination', async () => {
            // limit=1
            const res = await request(app).get(`/api/events?providerId=${providerId}&limit=1&page=1`);
            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(1);
            expect(res.body.page).toBe(1);
            expect(res.body.total).toBe(3);
        });
    });
});
