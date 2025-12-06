import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';
import pool from '../config/database'; // To get provider info if needed

// Extend Request to include provider info
declare global {
  namespace Express {
    interface Request {
      provider?: {
        id: string;
        name: string;
      };
    }
  }
}

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API Key' });
  }

  try {
    const keyRecord = await ApiKeyService.validateKey(apiKey);

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    // Fetch provider info
    const providerQuery = 'SELECT id, name FROM providers WHERE id = $1';
    const providerResult = await pool.query(providerQuery, [keyRecord.provider_id]);
    
    if (providerResult.rows.length === 0) {
      return res.status(401).json({ error: 'Provider not found' });
    }

    req.provider = providerResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
