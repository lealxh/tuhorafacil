import { Hono } from 'hono';
import { reiniciarSimulacion, simularMensaje } from '../agente/simular';

// Canal de prueba: la web llama a estos endpoints server-to-server para
// conversar con el agente sin WhatsApp. Protegido por secreto compartido para
// que nadie más gaste tokens del modelo.
export const mock = new Hono<{ Bindings: Env }>();

mock.use('*', async (c, next) => {
  if (c.req.header('X-Mock-Secret') !== c.env.MOCK_CHAT_SECRET) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

mock.post('/chat', async (c) => {
  const body = await c.req.json<{ estilistaId?: string; texto?: string }>().catch(() => null);
  const estilistaId = body?.estilistaId?.trim();
  const texto = body?.texto?.trim();
  if (!estilistaId || !texto) return c.json({ error: 'estilistaId y texto son requeridos' }, 400);

  const resultado = await simularMensaje(c.env, estilistaId, texto);
  return c.json(resultado);
});

mock.post('/chat/reset', async (c) => {
  const body = await c.req.json<{ estilistaId?: string }>().catch(() => null);
  const estilistaId = body?.estilistaId?.trim();
  if (!estilistaId) return c.json({ error: 'estilistaId es requerido' }, 400);

  await reiniciarSimulacion(c.env, estilistaId);
  return c.json({ ok: true });
});
