const GRAPH_VERSION = 'v23.0';
// Kapso proxyea la Cloud API de Meta: misma forma de body, solo cambia base y auth
const KAPSO_BASE = 'https://api.kapso.ai/meta/whatsapp/v24.0';

export interface CredencialesWa {
  kapsoApiKey?: string;
  waAccessToken?: string;
}

/**
 * Envía un texto por WhatsApp. Cadena degradante: Kapso (BSP) → Meta Graph
 * directo → log simulado (desarrollo o estilista aún no conectada).
 */
export async function enviarTexto(
  cred: CredencialesWa,
  phoneNumberId: string,
  para: string,
  texto: string
): Promise<void> {
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: para,
    type: 'text',
    text: { body: texto }
  });

  if (cred.kapsoApiKey) {
    const res = await fetch(`${KAPSO_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': cred.kapsoApiKey, 'Content-Type': 'application/json' },
      body
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: 'kapso_envio_error', status: res.status, detalle: await res.text() }));
    }
    return;
  }

  if (cred.waAccessToken) {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cred.waAccessToken}`, 'Content-Type': 'application/json' },
      body
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: 'wa_envio_error', status: res.status, detalle: await res.text() }));
    }
    return;
  }

  console.log(JSON.stringify({ event: 'wa_envio_simulado', phoneNumberId, para, texto }));
}

/**
 * Marca el mensaje entrante como leído y muestra "escribiendo…" en el WhatsApp
 * de la clienta (hasta 25s o hasta que llegue la respuesta). Best-effort: los
 * errores solo se loguean — nunca debe frenar al agente.
 */
export async function indicarEscribiendo(
  cred: CredencialesWa,
  phoneNumberId: string,
  waIdMensaje: string
): Promise<void> {
  let destino: { url: string; headers: Record<string, string> };
  if (cred.kapsoApiKey) {
    destino = { url: `${KAPSO_BASE}/${phoneNumberId}/messages`, headers: { 'X-API-Key': cred.kapsoApiKey } };
  } else if (cred.waAccessToken) {
    destino = {
      url: `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      headers: { Authorization: `Bearer ${cred.waAccessToken}` }
    };
  } else {
    return;
  }

  try {
    const res = await fetch(destino.url, {
      method: 'POST',
      headers: { ...destino.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: waIdMensaje,
        typing_indicator: { type: 'text' }
      })
    });
    if (!res.ok) {
      console.log(JSON.stringify({ event: 'wa_typing_error', status: res.status, detalle: await res.text() }));
    }
  } catch (e) {
    console.log(JSON.stringify({ event: 'wa_typing_error', detalle: String(e) }));
  }
}
