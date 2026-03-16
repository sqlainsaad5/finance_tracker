import { Pool, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('DATABASE_URL is not set; DB operations will fail.');
}

const globalForPool = globalThis as unknown as { pool: Pool };
export const pool =
  globalForPool.pool ??
  new Pool({
    connectionString,
    max: 10,
  });
if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await pool.query<T>(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

export function toNum(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}
