import { createDb, eq, estilistas, type Db } from '@tuhorafacil/db';

const KAPSO_PLATFORM = 'https://api.kapso.ai/platform/v1';

async function kapso(env: Env, ruta: string, init?: RequestInit): Promise<Response> {
  return fetch(`${KAPSO_PLATFORM}${ruta}`, {
    ...init,
    headers: { 'X-API-Key': env.KAPSO_API_KEY, 'Content-Type': 'application/json', ...init?.headers }
  });
}

/**
 * Crea (o reusa) el customer de Kapso de la estilista y genera un setup link
 * para que conecte su número self-service desde nuestro onboarding.
 */
export async function crearLinkConexion(
  env: Env,
  args: { estilistaId: string; successUrl: string; failureUrl: string }
): Promise<{ url: string } | { error: string }> {
  if (!env.KAPSO_API_KEY) return { error: 'Kapso no está configurado' };
  const db = createDb(env.DB);

  const estilista = await db.query.estilistas.findFirst({ where: eq(estilistas.id, args.estilistaId) });
  if (!estilista) return { error: 'Estilista no encontrada' };

  let customerId = estilista.kapsoCustomerId;
  if (!customerId) {
    const res = await kapso(env, '/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer: { name: estilista.nombreNegocio, external_customer_id: estilista.id }
      })
    });
    if (res.ok) {
      customerId = ((await res.json()) as { data: { id: string } }).data.id;
    } else {
      // Reintento tras un intento a medias: el customer puede existir de antes
      customerId = await buscarCustomerPorExternalId(env, estilista.id);
      if (!customerId) {
        console.error(JSON.stringify({ event: 'kapso_customer_error', status: res.status, detalle: await res.text() }));
        return { error: 'No se pudo crear el cliente en Kapso' };
      }
    }
    await db.update(estilistas).set({ kapsoCustomerId: customerId }).where(eq(estilistas.id, estilista.id));
  }

  const res = await kapso(env, `/customers/${customerId}/setup_links`, {
    method: 'POST',
    // Sin phone_number_country_isos: eso es para aprovisionar números nuevos
    // (requiere Twilio); nuestras estilistas conectan su número existente
    body: JSON.stringify({
      setup_link: {
        success_redirect_url: args.successUrl,
        failure_redirect_url: args.failureUrl
      }
    })
  });
  if (!res.ok) {
    console.error(JSON.stringify({ event: 'kapso_setup_link_error', status: res.status, detalle: await res.text() }));
    return { error: 'No se pudo generar el link de conexión' };
  }
  return { url: ((await res.json()) as { data: { url: string } }).data.url };
}

async function buscarCustomerPorExternalId(env: Env, externalId: string): Promise<string | null> {
  const res = await kapso(env, '/customers?per_page=100');
  if (!res.ok) return null;
  const { data } = (await res.json()) as { data: { id: string; external_customer_id?: string }[] };
  return data.find((c) => c.external_customer_id === externalId)?.id ?? null;
}

/**
 * Marca el número como conectado para la estilista y registra el webhook de
 * mensajes del número en Kapso (los webhooks de mensajes son por número).
 * Idempotente: se puede llamar desde el evento phone_number.created y desde
 * la confirmación al volver del setup link.
 */
export async function activarNumero(env: Env, db: Db, estilistaId: string, phoneNumberId: string): Promise<void> {
  await db
    .update(estilistas)
    .set({ waPhoneNumberId: phoneNumberId, waEstado: 'activo' })
    .where(eq(estilistas.id, estilistaId));
  console.log(JSON.stringify({ event: 'kapso_numero_activado', estilistaId, phoneNumberId }));

  await registrarWebhookDeNumero(env, phoneNumberId);
}

async function registrarWebhookDeNumero(env: Env, phoneNumberId: string): Promise<void> {
  if (!env.WEBHOOK_KAPSO_URL) return;

  const existentes = await kapso(env, `/whatsapp/phone_numbers/${phoneNumberId}/webhooks`);
  if (existentes.ok) {
    const { data } = (await existentes.json()) as { data: { url: string }[] };
    if (data.some((w) => w.url === env.WEBHOOK_KAPSO_URL)) return; // ya registrado
  }

  const res = await kapso(env, `/whatsapp/phone_numbers/${phoneNumberId}/webhooks`, {
    method: 'POST',
    body: JSON.stringify({
      whatsapp_webhook: {
        url: env.WEBHOOK_KAPSO_URL,
        kind: 'kapso',
        secret_key: env.KAPSO_WEBHOOK_SECRET,
        events: ['whatsapp.message.received', 'whatsapp.message.sent']
      }
    })
  });
  if (!res.ok) {
    console.error(JSON.stringify({ event: 'kapso_webhook_numero_error', status: res.status, detalle: await res.text() }));
  }
}

/**
 * Confirmación al volver del setup link: consulta los números del customer en
 * Kapso y activa el primero. Cubre el caso de que el evento webhook se pierda.
 */
export async function confirmarConexion(env: Env, estilistaId: string): Promise<{ conectado: boolean }> {
  if (!env.KAPSO_API_KEY) return { conectado: false };
  const db = createDb(env.DB);
  const estilista = await db.query.estilistas.findFirst({ where: eq(estilistas.id, estilistaId) });
  if (!estilista?.kapsoCustomerId) return { conectado: false };
  if (estilista.waEstado === 'activo' && estilista.waPhoneNumberId) return { conectado: true };

  const res = await kapso(env, `/customers/${estilista.kapsoCustomerId}/phone_numbers`);
  if (!res.ok) return { conectado: false };
  const { data } = (await res.json()) as { data: { phone_number_id?: string; id?: string }[] };
  const numero = data[0]?.phone_number_id ?? data[0]?.id;
  if (!numero) return { conectado: false };

  await activarNumero(env, db, estilistaId, numero);
  return { conectado: true };
}
