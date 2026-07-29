import { Hono } from 'hono';
import { generarRecordatorios } from '../recordatorios/generar';

// Endpoints internos que la web llama server-to-server. Protegidos por secreto
// compartido para que nadie más los use.
export const mock = new Hono<{ Bindings: Env }>();

mock.use('*', async (c, next) => {
  if (c.req.header('X-Mock-Secret') !== c.env.MOCK_CHAT_SECRET) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

// Dispara la generación de recordatorios sin esperar al cron (para la vista de prueba)
mock.post('/recordatorios', async (c) => {
  const body = await c.req.json<{ estilistaId?: string }>().catch(() => null);
  const estilistaId = body?.estilistaId?.trim();
  if (!estilistaId) return c.json({ error: 'estilistaId es requerido' }, 400);

  const generados = await generarRecordatorios(c.env, estilistaId);
  return c.json({ generados });
});
