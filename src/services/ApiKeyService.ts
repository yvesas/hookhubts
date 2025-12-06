import pool from '../config/database';
import { ApiKey } from '../models/ApiKey';
import crypto from 'crypto';

export class ApiKeyService {
  static async findActiveKey(hash: string): Promise<ApiKey | null> {
    const query = `
      SELECT * FROM api_keys 
      WHERE key_hash = $1 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
      AND revoked_at IS NULL
    `;
    const result = await pool.query(query, [hash]);
    return result.rows[0] || null;
  }

  // Helper to hash an incoming key for comparison
  // (Assuming keys are provided as 'prefix.secret')
  static async validateKey(rawKey: string): Promise<ApiKey | null> {
    // In a real scenario, we might hash the key here.
    // For simplicity, assuming rawKey IS the hash or we store plain hashes (not recommended for prod but ok for simplicity if specified, 
    // but plan mentioned 'hash seguro').
    // Let's assume we store the SHA256 of the key in DB.
    
    // If the key format is 'prefix.secret', we hash the full key or just secret? 
    // Usually we hash the full key.
    
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    return this.findActiveKey(hash);
  }

  static async createKey(providerId: string, name?: string) {
    // Generate a random key
    const secret = crypto.randomBytes(16).toString('hex');
    const prefix = 'sk';
    const key = `${prefix}_${secret}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO api_keys (provider_id, key_hash, key_prefix, name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, key_prefix, name, created_at, is_active
        `;
        const result = await client.query(query, [providerId, hash, prefix, name]);
        
        // Return the full key ONLY here
        return { ...result.rows[0], secret: key };
    } finally {
        client.release();
    }
  }

  static async listKeys(providerId?: string) {
      let query = `
        SELECT k.id, k.key_prefix, k.name, k.created_at, k.is_active, k.revoked_at, p.name as provider_name
        FROM api_keys k
        JOIN providers p ON k.provider_id = p.id
      `;
      
      const values: string[] = [];
      if (providerId) {
          query += ` WHERE k.provider_id = $1`;
          values.push(providerId);
      }
      
      query += ` ORDER BY k.created_at DESC`;

      const result = await pool.query(query, values);
      return result.rows.map(row => ({
          ...row,
          token: `${row.key_prefix}_...` // Masked
      }));
  }

  static async revokeKey(id: string) {
      const query = `
        UPDATE api_keys 
        SET is_active = false, revoked_at = NOW() 
        WHERE id = $1 
        RETURNING id
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
  }
}
