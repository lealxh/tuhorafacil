import { Hono } from 'hono';
import { health } from './routes/health';
import { webhook } from './routes/webhook';

const app = new Hono<{ Bindings: Env }>();

app.route('/health', health);
app.route('/webhook', webhook);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error(JSON.stringify({ event: 'unhandled_error', message: err.message, stack: err.stack }));
  return c.json({ error: 'internal_error' }, 500);
});

export default app;
