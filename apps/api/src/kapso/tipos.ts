/** Subconjunto del payload de webhooks de Kapso que usamos (formato propio, no Meta). */

export interface KapsoWebhookBody {
  type?: string;
  /** true → data es un array de eventos agrupados */
  batch?: boolean;
  data?: KapsoEvento | KapsoEvento[];
}

export interface KapsoEvento {
  phone_number_id?: string;
  message?: {
    id?: string;
    type?: string;
    from?: string;
    to?: string;
    text?: { body?: string };
    kapso?: {
      direction?: string;
      /** 'business_app' cuando la estilista escribió desde su teléfono (eco coexistence) */
      origin?: string;
      phone_number?: string;
      contact_name?: string;
    };
  };
  conversation?: {
    id?: string;
    phone_number?: string;
    contact_name?: string;
  };
}
