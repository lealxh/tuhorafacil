import { Hono } from 'hono';
import { procesarWebhook } from '../agente/orquestador';
import type { WebhookPayload } from '../whatsapp/tipos';

export const webhook = new Hono<{ Bindings: Env }>();

// Verificación del webhook (Meta la llama al configurarlo)
webhook.get('/whatsapp', (c) => {
  const modo = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');
  if (modo === 'subscribe' && token === c.env.WA_VERIFY_TOKEN && challenge) {
    return c.text(challenge, 200);
  }
  return c.text('forbidden', 403);
});

// Meta exige respuesta en <5s: 200 inmediato y el agente corre en background.
// TODO(fase Meta): validar la firma X-Hub-Signature-256 cuando exista el app secret.
webhook.post('/whatsapp', async (c) => {
  const payload = await c.req.json<WebhookPayload>().catch(() => null);
  if (payload) c.executionCtx.waitUntil(procesarWebhook(c.env, payload));
  return c.text('OK', 200);
});
