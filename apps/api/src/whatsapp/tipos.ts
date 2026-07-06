/** Subconjunto del payload de webhooks de la WhatsApp Cloud API que usamos. */

export interface WebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: CambioValor;
    }>;
  }>;
}

export interface CambioValor {
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<MensajeEntrante>;
  /** Coexistence: ecos de mensajes que la estilista envió desde su teléfono */
  message_echoes?: Array<{ to?: string; from?: string; type?: string }>;
  statuses?: unknown[];
}

export interface MensajeEntrante {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
}
