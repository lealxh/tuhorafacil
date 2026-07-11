import { Hono } from 'hono';
import { generarRecordatorios } from './recordatorios/generar';
import { health } from './routes/health';
import { mock } from './routes/mock';
import { webhook } from './routes/webhook';

const app = new Hono<{ Bindings: Env }>();

app.route('/health', health);
app.route('/webhook', webhook);
app.route('/mock', mock);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error(JSON.stringify({ event: 'unhandled_error', message: err.message, stack: err.stack }));
  return c.json({ error: 'internal_error' }, 500);
});

export default {
  fetch: app.fetch,
  // Cada 5 min: recordatorios de las citas de hoy según las reglas configurables
  // por admin (batch matinal + rezagadas con aviso mínimo). La frecuencia además
  // mantiene tibios el Worker y D1 (keep-warm contra cold starts de ~20s).
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(generarRecordatorios(env));
  }
};
