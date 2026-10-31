import fs from 'fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!process.env.SQL_HOST || !process.env.SQL_HOST.trim()) {
    return null;
  }
  // If SQL_HOST is a Unix socket path, check if it exists
  if (process.env.SQL_HOST.startsWith('/')) {
    try {
      if (!fs.existsSync(process.env.SQL_HOST)) {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (!global._postgresPool) {
    try {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 5,
        connectionTimeoutMillis: 2000,
      });

      global._postgresPool.on('error', () => {
        // Suppress idle pool errors to keep logs clean
      });
    } catch (e) {
      return null;
    }
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = pool ? drizzle(pool, { schema }) : ({} as any);
