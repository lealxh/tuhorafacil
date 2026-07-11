import { Hono } from 'hono';
import { reiniciarSimulacion, simularMensaje } from '../agente/simular';
import { generarRecordatorios } from '../recordatorios/generar';

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

  const inicio = Date.now();
  const resultado = await simularMensaje(c.env, estilistaId, texto);
  // Para diagnosticar latencias (cold start vs LLM): comparar con el ms del lado web
  console.log(JSON.stringify({ event: 'mock_chat_ms', ms: Date.now() - inicio, gate: resultado.gate ?? false }));
  return c.json(resultado);
});

// Dispara la generación de recordatorios sin esperar al cron (para la vista de prueba)
mock.post('/recordatorios', async (c) => {
  const body = await c.req.json<{ estilistaId?: string }>().catch(() => null);
  const estilistaId = body?.estilistaId?.trim();
  if (!estilistaId) return c.json({ error: 'estilistaId es requerido' }, 400);

  const generados = await generarRecordatorios(c.env, estilistaId);
  return c.json({ generados });
});

mock.post('/chat/reset', async (c) => {
  const body = await c.req.json<{ estilistaId?: string }>().catch(() => null);
  const estilistaId = body?.estilistaId?.trim();
  if (!estilistaId) return c.json({ error: 'estilistaId es requerido' }, 400);

  await reiniciarSimulacion(c.env, estilistaId);
  return c.json({ ok: true });
});
