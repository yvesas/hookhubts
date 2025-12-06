import pool from '../config/database';

interface AnalyticsStats {
  totalWebhooks: number;
  last24Hours: number;
  successRate: number;
  avgResponseTime: number;
  webhooksByProvider: Array<{ name: string; count: number }>;
  topEventTypes: Array<{ event_type: string; count: number }>;
  providerStats: Array<{
    name: string;
    totalEvents: number;
    lastEvent: Date | null;
  }>;
}

export class AnalyticsService {
  static async getAnalytics(days: number = 30): Promise<AnalyticsStats> {
    const client = await pool.connect();
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      // Total webhooks in period
      const totalResult = await client.query(
        'SELECT COUNT(*) as count FROM events WHERE created_at >= $1',
        [sinceDate]
      );
      const totalWebhooks = parseInt(totalResult.rows[0].count);

      // Last 24 hours
      const last24h = new Date();
      last24h.setHours(last24h.getHours() - 24);
      const last24Result = await client.query(
        'SELECT COUNT(*) as count FROM events WHERE created_at >= $1',
        [last24h]
      );
      const last24Hours = parseInt(last24Result.rows[0].count);

      // Success rate (assuming all events are successful for now)
      const successRate = 100;

      // Avg response time (mock data for now, could be tracked in future)
      const avgResponseTime = Math.floor(Math.random() * 50) + 50; // 50-100ms

      // Webhooks by provider
      const providerCountResult = await client.query(`
        SELECT p.name, COUNT(e.id) as count
        FROM providers p
        LEFT JOIN events e ON e.provider_id = p.id AND e.created_at >= $1
        GROUP BY p.name
        ORDER BY count DESC
      `, [sinceDate]);
      const webhooksByProvider = providerCountResult.rows.map(row => ({
        name: row.name,
        count: parseInt(row.count)
      }));

      // Top event types
      const topTypesResult = await client.query(`
        SELECT event_type, COUNT(*) as count
        FROM events
        WHERE created_at >= $1
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `, [sinceDate]);
      const topEventTypes = topTypesResult.rows.map(row => ({
        event_type: row.event_type,
        count: parseInt(row.count)
      }));

      // Provider stats
      const providerStatsResult = await client.query(`
        SELECT 
          p.name,
          COUNT(e.id) as total_events,
          MAX(e.timestamp) as last_event
        FROM providers p
        LEFT JOIN events e ON e.provider_id = p.id
        GROUP BY p.id, p.name
        ORDER BY p.name
      `);
      const providerStats = providerStatsResult.rows.map(row => ({
        name: row.name,
        totalEvents: parseInt(row.total_events),
        lastEvent: row.last_event ? new Date(row.last_event) : null
      }));

      return {
        totalWebhooks,
        last24Hours,
        successRate,
        avgResponseTime,
        webhooksByProvider,
        topEventTypes,
        providerStats
      };
    } finally {
      client.release();
    }
  }
}
