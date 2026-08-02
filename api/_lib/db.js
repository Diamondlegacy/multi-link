import { Pool } from "pg";

// Vercel Postgres (Neon) sets POSTGRES_URL automatically once you connect
// a database to your project. DATABASE_URL is a fallback for other providers.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool;

export function getPool() {
  if (!pool) {
    if (!connectionString) {
      throw new Error(
        "No database connection string found. Set POSTGRES_URL (Vercel Postgres) or DATABASE_URL in your project's Environment Variables."
      );
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}
