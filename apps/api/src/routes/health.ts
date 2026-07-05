import { Hono } from 'hono';

export const health = new Hono<{ Bindings: Env }>();

health.get('/', async (c) => {
  const db = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
  return c.json({ ok: true, service: 'tuhorafacil-api', db: db?.ok === 1 });
});
