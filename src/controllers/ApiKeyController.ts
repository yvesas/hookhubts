import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';

export class ApiKeyController {
  static async create(req: Request, res: Response) {
    try {
      const { providerId, name } = req.body;
      if (!providerId) {
        return res.status(400).json({ error: 'providerId is required' });
      }
      const result = await ApiKeyService.createKey(providerId, name);
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { providerId } = req.query;
      if (!providerId) {
        return res.status(400).json({ error: 'providerId is required' });
      }
      const result = await ApiKeyService.listKeys(providerId as string);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async revoke(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ApiKeyService.revokeKey(id);
      if (!result) {
        return res.status(404).json({ error: 'Key not found' });
      }
      res.json({ status: 'revoked', id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
