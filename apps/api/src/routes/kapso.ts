import { Hono } from 'hono';
import { confirmarConexion, crearLinkConexion } from '../kapso/conexion';

// Endpoints internos para la web (server-to-server vía service binding).
// Guardados con el mismo secreto compartido del canal interno (MOCK_CHAT_SECRET).
export const kapso = new Hono<{ Bindings: Env }>();

kapso.use('*', async (c, next) => {
  if (c.req.header('X-Mock-Secret') !== c.env.MOCK_CHAT_SECRET) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

// Genera el setup link de Kapso para que la estilista conecte su número
kapso.post('/setup-link', async (c) => {
  const body = await c.req.json<{ estilistaId?: string; successUrl?: string; failureUrl?: string }>().catch(() => null);
  if (!body?.estilistaId || !body.successUrl || !body.failureUrl) {
    return c.json({ error: 'estilistaId, successUrl y failureUrl son requeridos' }, 400);
  }
  const r = await crearLinkConexion(c.env, {
    estilistaId: body.estilistaId,
    successUrl: body.successUrl,
    failureUrl: body.failureUrl
  });
  return 'error' in r ? c.json(r, 502) : c.json(r);
});

// Al volver del setup link: verifica contra Kapso y activa el número (backup del webhook)
kapso.post('/confirmar', async (c) => {
  const body = await c.req.json<{ estilistaId?: string }>().catch(() => null);
  if (!body?.estilistaId) return c.json({ error: 'estilistaId es requerido' }, 400);
  return c.json(await confirmarConexion(c.env, body.estilistaId));
});
