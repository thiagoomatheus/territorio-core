import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

export const db = drizzle(process.env.DATABASE_URL);
export const pool = db.$client;

export * from './schema';