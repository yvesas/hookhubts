import pool from '../config/database';
import { NormalizedEvent, DbEvent } from '../models/Event';

export class EventService {
  static async createEvent(providerId: string, event: NormalizedEvent): Promise<DbEvent | null> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO events (
          provider_id, external_event_id, event_type, timestamp,
          sender_id, sender_name, recipient_id, recipient_name,
          message_type, message_body, platform, raw_payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING *
      `;

      const values = [
        providerId,
        event.external_event_id,
        event.event_type,
        event.timestamp,
        event.sender_id,
        event.sender_name,
        event.recipient_id,
        event.recipient_name,
        event.message_type,
        event.message_body,
        event.platform,
        event.raw_payload
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === '23505') {
        // Unique violation (idempotency)
        console.warn(`Duplicate event ignored: ${event.external_event_id} for provider ${providerId}`);
        return null; // Treated as success (idempotent)
      }
      console.error('Error creating event:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  static async getEvents(filters: { providerId?: string; eventType?: string; startDate?: string; endDate?: string }, pagination: { limit: number; offset: number }) {
    const { providerId, eventType, startDate, endDate } = filters;
    const { limit, offset } = pagination;
    
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (providerId) {
      conditions.push(`provider_id = $${paramIndex++}`);
      values.push(providerId);
    }

    if (eventType) {
      conditions.push(`event_type = $${paramIndex++}`);
      values.push(eventType);
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT e.*, p.name as provider_name 
      FROM events e
      JOIN providers p ON e.provider_id = p.id
      ${whereClause}
      ORDER BY e.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    values.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM events ${whereClause}`;
    // Note: values for count don't need limit/offset, so we slice values
    const countValues = values.slice(0, paramIndex - 3);

    const client = await pool.connect();
    try {
      const [result, countResult] = await Promise.all([
        client.query(query, values),
        client.query(countQuery, countValues)
      ]);
      
      return {
        events: result.rows,
        total: parseInt(countResult.rows[0].count, 10),
        page: Math.floor(offset / limit) + 1,
        perPage: limit
      };
    } finally {
      client.release();
    }
  }
}
