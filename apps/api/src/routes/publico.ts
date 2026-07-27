import { Hono } from 'hono';
import { chatWebMensaje, historialWeb } from '../agente/chatWeb';

// Chat del agente en la página pública. Lo llama la web por service binding;
// guardado con el secreto compartido (Turnstile es la capa anti-bot en la web).
export const publico = new Hono<{ Bindings: Env }>();

publico.use('*', async (c, next) => {
  if (c.req.header('X-Mock-Secret') !== c.env.MOCK_CHAT_SECRET) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

publico.post('/chat', async (c) => {
  const b = await c.req.json<{ estilistaId?: string; sesion?: string; texto?: string }>().catch(() => null);
  const texto = b?.texto?.trim();
  if (!b?.estilistaId || !b.sesion || !texto) return c.json({ error: 'estilistaId, sesion y texto son requeridos' }, 400);
  return c.json(await chatWebMensaje(c.env, b.estilistaId, b.sesion, texto));
});

publico.post('/historial', async (c) => {
  const b = await c.req.json<{ estilistaId?: string; sesion?: string }>().catch(() => null);
  if (!b?.estilistaId || !b.sesion) return c.json({ error: 'estilistaId y sesion son requeridos' }, 400);
  return c.json({ mensajes: await historialWeb(c.env, b.estilistaId, b.sesion) });
});
