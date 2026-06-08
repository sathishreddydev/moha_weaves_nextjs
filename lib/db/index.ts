import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/shared/schemas';

// Lazy database connection — only connects when first accessed at runtime.
// This prevents build-time crashes since DATABASE_URL isn't available during `next build`.

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  _db = drizzle(client, { schema });
  return _db;
}

// Export a proxy that lazily initializes on first property access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    return (instance as any)[prop];
  },
});
