import { Request, Response } from 'express';
import { EventService } from '../services/EventService';

export class EventController {
  static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const filters = {
        providerId: req.query.providerId,
        eventType: req.query.eventType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await EventService.getEvents(filters, { limit, offset });
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
