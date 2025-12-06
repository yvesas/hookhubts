import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { ApiKeyService } from '../services/ApiKeyService';
import pool from '../config/database'; // Direct access for simpler provider list

export class WebController {
  static async index(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const filters = {
        providerId: req.query.providerId,
        eventType: req.query.eventType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await EventService.getEvents(filters, { limit, offset });
      
      // Also fetch providers for filter dropdown
      const providersRes = await pool.query('SELECT id, name FROM providers ORDER BY name');

      res.render('index', { 
        events: result.events, 
        pagination: { 
          page: result.page, 
          perPage: result.perPage, 
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        },
        providers: providersRes.rows,
        filters,
        body: '' // EJS layout helper usually handles body inclusion differently, but for manual layout valid
        // Actually typically using express-ejs-layouts or just include header/footer in every file.
        // We will use include header/footer approach or express-ejs-layouts. 
        // For simplicity, let's assume we use includes in the views or just standard layouts if configured.
        // Since I didn't install express-ejs-layouts, I will use "partials" approach or simple includes.
        // But wait, the main.ejs snippet used <%- body %>. That requires express-ejs-layouts.
        // I should install express-ejs-layouts or change to includes.
        // I'll install express-ejs-layouts for cleaner code.
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
    
    let keys: any[] = [];
    if (selectedProviderId) {
      keys = await ApiKeyService.listKeys(selectedProviderId);
    }

    res.render('keys', { 
      providers: providersRes.rows,
      selectedProviderId,
      keys
    });
  }
}
