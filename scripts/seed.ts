import pool from '../src/config/database';
import crypto from 'crypto';

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding...');
    
    // Create Provider: MessageFlow
    const providerRes = await client.query(
      `INSERT INTO providers (name, description) VALUES ($1, $2) 
       ON CONFLICT (name) DO UPDATE SET description = $2
       RETURNING id`,
      ['MessageFlow', 'MessageFlow Provider']
    );
    const providerId = providerRes.rows[0].id;

    // Create API Key
    const rawKey = 'mf_secret_123';
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    await client.query(
      `INSERT INTO api_keys (provider_id, key_hash, key_prefix, name) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key_hash) DO NOTHING`,
      [providerId, hash, 'mf', 'Dev Key']
    );

    console.log(`Seeding complete. Use Key: ${rawKey}`);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();
