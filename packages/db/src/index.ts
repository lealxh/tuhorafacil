import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as authSchema from './auth-schema';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema: { ...schema, ...authSchema } });
}

export type Db = ReturnType<typeof createDb>;
export * from './schema';
export * from './auth-schema';
// Única instancia de drizzle-orm para todo el monorepo: los consumidores
// importan los operadores desde aquí, nunca desde 'drizzle-orm' directo
// (pnpm crea instancias paralelas por peer-set y los tipos dejan de calzar).
export { and, asc, desc, eq, gte, like, lte, ne, sql } from 'drizzle-orm';
