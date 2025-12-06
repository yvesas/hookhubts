import fs from 'fs';
import path from 'path';
import pool from '../src/config/database';

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`Completed: ${file}`);
      }
    }
    console.log('All migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

runMigrations();
