const GRAPH_VERSION = 'v23.0';

/**
 * Envía un texto por la Cloud API. Sin token configurado (desarrollo o
 * estilista aún no conectada) se loguea el mensaje en vez de enviarse.
 */
export async function enviarTexto(
  token: string | undefined,
  phoneNumberId: string,
  para: string,
  texto: string
): Promise<void> {
  if (!token) {
    console.log(JSON.stringify({ event: 'wa_envio_simulado', phoneNumberId, para, texto }));
    return;
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: para,
      type: 'text',
      text: { body: texto }
    })
  });
  if (!res.ok) {
    console.error(JSON.stringify({ event: 'wa_envio_error', status: res.status, detalle: await res.text() }));
  }
}
