import { Request, Response } from 'express';
import { NormalizerService } from '../services/NormalizerService';
import { EventService } from '../services/EventService';

export class WebhookController {
  static async ingest(req: Request, res: Response) {
    try {
      if (!req.provider) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Identify provider type
      // Option A: Provider name matches the parser login (Case insensitive)
      // Option B: Query param or Header specifies the 'type' (e.g. ?type=MessageFlow)
      // Option C: We map Provider Name 'MessageFlow' to parser 'MessageFlow'.
      
      const providerName = req.provider.name; 
      
      // Normalize
      const normalizedEvent = NormalizerService.normalize(providerName, req.body);

      // Persist
      const result = await EventService.createEvent(req.provider.id, normalizedEvent);

      if (!result) {
        // Idempotent success (duplicate)
        return res.status(200).json({ status: 'success', message: 'Event received (duplicate)' });
      }

      return res.status(201).json({ status: 'success', id: result.id });
    } catch (error: any) {
      console.error('Ingest Error:', error);
      // Determine if it is a normalization error (Bad Request) or Server Error
      // For simplicity, 500. Zod validation would be 400.
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
}
