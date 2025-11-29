import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
// Environment variables set before this (e.g., from scripts) will take precedence
config({ path: resolve(__dirname, '.env.local'), override: false });

// Use DATABASE_URL from environment (set by scripts) or fall back to DATABASE_URL_PROD from .env.local
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PROD || '';

export default {
  schema: './src/database/drizzle/schema.ts',
  out: './src/database/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;

