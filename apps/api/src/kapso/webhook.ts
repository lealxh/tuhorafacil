import {
  normalizarTelefono,
  procesarEco,
  procesarMensajeEntrante,
  type EntradaMensaje
} from '../agente/orquestador';
import type { KapsoEvento, KapsoWebhookBody } from './tipos';

/** Verifica X-Webhook-Signature: HMAC SHA256 (hex, con prefijo sha256= opcional) del body crudo. */
export async function verificarFirmaKapso(
  cuerpo: string,
  firma: string | null | undefined,
  secret: string
): Promise<boolean> {
  if (!firma) return false;
  const recibida = firma.replace(/^sha256=/, '').toLowerCase();

  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpo)));
  const esperada = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');

  // Comparación en tiempo constante
  if (recibida.length !== esperada.length) return false;
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= recibida.charCodeAt(i) ^ esperada.charCodeAt(i);
  return diff === 0;
}

export function eventosDe(body: KapsoWebhookBody): KapsoEvento[] {
  if (!body.data) return [];
  return Array.isArray(body.data) ? body.data : [body.data];
}

export type AccionKapso =
  | { accion: 'entrante'; entrada: EntradaMensaje }
  | { accion: 'eco'; phoneNumberId: string; telefonoClienta: string }
  | { accion: 'ignorar'; motivo: string };

/** Traduce un evento Kapso a la entrada normalizada del núcleo del agente. Puro, testeable. */
export function mapearEventoKapso(tipo: string | undefined, evento: KapsoEvento): AccionKapso {
  const phoneNumberId = evento.phone_number_id;
  if (!phoneNumberId) return { accion: 'ignorar', motivo: 'sin_phone_number_id' };
  const mensaje = evento.message;

  if (tipo === 'whatsapp.message.received') {
    const telefono = mensaje?.from ?? mensaje?.kapso?.phone_number ?? evento.conversation?.phone_number;
    if (!telefono) return { accion: 'ignorar', motivo: 'sin_telefono' };
    return {
      accion: 'entrante',
      entrada: {
        phoneNumberId,
        telefono: normalizarTelefono(telefono),
        nombrePerfil: evento.conversation?.contact_name ?? mensaje?.kapso?.contact_name ?? 'Clienta',
        tipo: mensaje?.type ?? 'text',
        texto: mensaje?.text?.body,
        waId: mensaje?.id
      }
    };
  }

  if (tipo === 'whatsapp.message.sent') {
    // Solo nos interesan los ecos de coexistence; los envíos de nuestra propia API se ignoran
    if (mensaje?.kapso?.origin !== 'business_app') return { accion: 'ignorar', motivo: 'envio_propio' };
    const telefono = evento.conversation?.phone_number ?? mensaje?.to ?? mensaje?.kapso?.phone_number;
    if (!telefono) return { accion: 'ignorar', motivo: 'sin_telefono' };
    return { accion: 'eco', phoneNumberId, telefonoClienta: normalizarTelefono(telefono) };
  }

  return { accion: 'ignorar', motivo: `evento_${tipo ?? 'desconocido'}` };
}

export async function procesarWebhookKapso(env: Env, body: KapsoWebhookBody): Promise<void> {
  for (const evento of eventosDe(body)) {
    try {
      const mapeado = mapearEventoKapso(body.type, evento);
      if (mapeado.accion === 'entrante') {
        await procesarMensajeEntrante(env, mapeado.entrada);
      } else if (mapeado.accion === 'eco') {
        await procesarEco(env, { phoneNumberId: mapeado.phoneNumberId, telefonoClienta: mapeado.telefonoClienta });
      } else {
        console.log(JSON.stringify({ event: 'kapso_ignorado', motivo: mapeado.motivo }));
      }
    } catch (e) {
      console.error(JSON.stringify({ event: 'kapso_error', error: String(e) }));
    }
  }
}
