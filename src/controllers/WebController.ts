import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { ApiKeyService } from '../services/ApiKeyService';
import { AnalyticsService } from '../services/AnalyticsService';
import pool from '../config/database'; // Direct access for simpler provider list

export class WebController {
  static async index(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const filters = {
        providerId: req.query.providerId as string | undefined,
        eventType: req.query.eventType as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };

      const result = await EventService.getEvents(filters, { limit, offset });
      
      // Also fetch providers for filter dropdown
      const providersRes = await pool.query('SELECT id, name FROM providers ORDER BY name');

      res.render('index', { 
        currentPage: 'events',
        events: result.events, 
        pagination: { 
          page: result.page, 
          perPage: result.perPage, 
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        },
        providers: providersRes.rows,
        filters
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error');
    }
  }

  static async keys(req: Request, res: Response) {
    // List providers to select from
    const providersRes = await pool.query('SELECT id, name FROM providers ORDER BY name');
    const selectedProviderId = req.query.providerId as string;
    
    let keys: Array<{ id: string; provider_name: string; key_prefix: string; name: string; is_active: boolean; created_at: Date }> = [];
    if (selectedProviderId) {
      keys = await ApiKeyService.listKeys(selectedProviderId);
    }

    res.render('keys', { 
      currentPage: 'keys',
      providers: providersRes.rows,
      selectedProviderId,
      keys
    });
  }

  static async analytics(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await AnalyticsService.getAnalytics(days);

      res.render('analytics', {
        currentPage: 'analytics',
        selectedDays: days,
        ...stats
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).send('Error loading analytics');
    }
  }
}
