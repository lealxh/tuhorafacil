import Anthropic from '@anthropic-ai/sdk';
import { fechaLocalHoy } from '@tuhorafacil/agenda';
import {
  and,
  asc,
  citas,
  clientasFinales,
  configAgente,
  configuracion,
  consumoMensual,
  conversaciones,
  createDb,
  eq,
  estilistas,
  gte,
  horarios,
  mensajes,
  servicios,
  sql,
  tiers,
  type Db
} from '@tuhorafacil/db';
import { construirSystemPrompt } from '@tuhorafacil/agenda';
import { enviarTexto } from '../whatsapp/enviar';
import type { WebhookPayload } from '../whatsapp/tipos';
import { ejecutarTool, TOOLS, type ContextoTools } from './tools';

const MODELO = 'claude-haiku-4-5';
// Precios Claude Haiku 4.5 en USD por token (tarifas por millón: $1 entrada, $5 salida)
const USD_POR_TOKEN_ENTRADA = 1 / 1_000_000;
const USD_POR_TOKEN_SALIDA = 5 / 1_000_000;
const MAX_ITERACIONES = 6;
const HISTORIAL_MAX = 30;
const COOLDOWN_COEXISTENCE_MS = 10 * 60 * 1000;
const FALLBACK = 'Dame un momento y te respondo 🙏';
const LIMITE_ALCANZADO =
  'En este momento no puedo agendar por aquí 🙏 La estilista te responderá personalmente apenas pueda.';

/** Mensaje entrante ya normalizado, independiente del canal (Meta directo, Kapso, …). */
export interface EntradaMensaje {
  phoneNumberId: string;
  /** E.164 con + */
  telefono: string;
  nombrePerfil: string;
  tipo: string;
  texto?: string;
  /** wamid del mensaje: si viene, deduplica reintentos de webhook */
  waId?: string;
}

/** Mapper del webhook de la WhatsApp Cloud API (Meta directo / webhook simulado DEMO_PHONE_ID). */
export async function procesarWebhook(env: Env, payload: WebhookPayload): Promise<void> {
  for (const entry of payload.entry ?? []) {
    for (const cambio of entry.changes ?? []) {
      const valor = cambio.value;
      const phoneNumberId = valor?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      try {
        if (cambio.field === 'smb_message_echoes' || valor.message_echoes?.length) {
          for (const eco of valor.message_echoes ?? []) {
            if (!eco.to) continue;
            await procesarEco(env, { phoneNumberId, telefonoClienta: normalizarTelefono(eco.to) });
          }
        } else {
          for (const mensaje of valor.messages ?? []) {
            if (!mensaje.from) continue;
            await procesarMensajeEntrante(env, {
              phoneNumberId,
              telefono: normalizarTelefono(mensaje.from),
              nombrePerfil: valor.contacts?.find((c) => c.wa_id === mensaje.from)?.profile?.name ?? 'Clienta',
              tipo: mensaje.type ?? 'text',
              texto: mensaje.text?.body,
              waId: mensaje.id
            });
          }
        }
      } catch (e) {
        console.error(JSON.stringify({ event: 'webhook_error', error: String(e) }));
      }
    }
  }
}

/** Coexistence: la estilista respondió desde su teléfono → pausar el agente en esa conversación. */
export async function procesarEco(
  env: Env,
  eco: { phoneNumberId: string; telefonoClienta: string }
): Promise<void> {
  const db = createDb(env.DB);
  const estilista = await estilistaPorPhoneId(db, eco.phoneNumberId);
  if (!estilista) return;

  const clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilista.id), eq(clientasFinales.telefono, eco.telefonoClienta))
  });
  if (!clienta) return;
  await db
    .update(conversaciones)
    .set({ agentePausadoHasta: new Date(Date.now() + COOLDOWN_COEXISTENCE_MS) })
    .where(and(eq(conversaciones.estilistaId, estilista.id), eq(conversaciones.clientaId, clienta.id)));
}

export async function procesarMensajeEntrante(env: Env, entrada: EntradaMensaje): Promise<void> {
  const db = createDb(env.DB);

  const estilista = await estilistaPorPhoneId(db, entrada.phoneNumberId);
  if (!estilista) {
    console.log(JSON.stringify({ event: 'webhook_sin_estilista', phoneNumberId: entrada.phoneNumberId }));
    return;
  }

  const { telefono, nombrePerfil } = entrada;

  let clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilista.id), eq(clientasFinales.telefono, telefono))
  });
  clienta ??= (await db.insert(clientasFinales).values({ estilistaId: estilista.id, nombre: nombrePerfil, telefono }).returning())[0];

  let conversacion = await db.query.conversaciones.findFirst({
    where: and(eq(conversaciones.estilistaId, estilista.id), eq(conversaciones.clientaId, clienta.id))
  });
  conversacion ??= (await db.insert(conversaciones).values({ estilistaId: estilista.id, clientaId: clienta.id }).returning())[0];
  await db.update(conversaciones).set({ ultimoMensajeAt: new Date() }).where(eq(conversaciones.id, conversacion.id));

  const contenido = entrada.tipo === 'text' ? (entrada.texto ?? '') : `[mensaje de tipo ${entrada.tipo}]`;
  const insertado = await db
    .insert(mensajes)
    .values({ conversacionId: conversacion.id, rol: 'clienta', contenido, waId: entrada.waId })
    .onConflictDoNothing()
    .returning({ id: mensajes.id });
  // Reintento del webhook con el mismo wamid: ya fue procesado, no responder de nuevo
  if (entrada.waId && insertado.length === 0) {
    console.log(JSON.stringify({ event: 'mensaje_duplicado', waId: entrada.waId }));
    return;
  }

  // Gates: estado de la cuenta, tier, agente activo, cooldown por Coexistence
  if (estilista.estado !== 'activa' || estilista.waEstado !== 'activo') return;
  const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
  if (!tier?.tieneAgente) return;
  const config = await db.query.configAgente.findFirst({ where: eq(configAgente.estilistaId, estilista.id) });
  if (config && !config.activo) return;
  if (conversacion.agentePausadoHasta && conversacion.agentePausadoHasta.getTime() > Date.now()) return;

  const responder = async (texto: string, tokens?: { entrada: number; salida: number }) => {
    await enviarTexto(
      { kapsoApiKey: env.KAPSO_API_KEY || undefined, waAccessToken: env.WA_ACCESS_TOKEN || undefined },
      entrada.phoneNumberId,
      telefono,
      texto
    );
    await db.insert(mensajes).values({
      conversacionId: conversacion.id,
      rol: 'agente',
      contenido: texto,
      tokensEntrada: tokens?.entrada,
      tokensSalida: tokens?.salida
    });
  };

  // Límite mensual del plan (F9)
  const mes = fechaLocalHoy().slice(0, 7);
  if (tier.limiteMensajesMes != null) {
    const consumo = await db.query.consumoMensual.findFirst({
      where: and(eq(consumoMensual.estilistaId, estilista.id), eq(consumoMensual.mes, mes))
    });
    if ((consumo?.mensajesAgente ?? 0) >= tier.limiteMensajesMes) {
      await responder(LIMITE_ALCANZADO);
      return;
    }
  }

  if (entrada.tipo !== 'text') {
    await responder('Por ahora solo puedo leer mensajes de texto 🙏 ¿Me lo puedes escribir?');
    return;
  }

  const ctxTools: ContextoTools = {
    db,
    estilistaId: estilista.id,
    clientaId: clienta.id,
    telefono,
    conversacionId: conversacion.id,
    citasCreadas: { count: 0 }
  };

  try {
    console.log(JSON.stringify({ event: 'agente_inicio', conversacionId: conversacion.id }));
    const respuesta = await correrAgente(env, db, estilista, clienta, conversacion.id, ctxTools);
    console.log(JSON.stringify({ event: 'agente_ok', tokens: respuesta.tokens }));
    await responder(respuesta.texto, respuesta.tokens);
    await registrarConsumo(db, estilista.id, mes, respuesta.tokens, ctxTools.citasCreadas.count);
  } catch (e) {
    // Degradación con gracia: la clienta recibe una respuesta y la estilista ve la conversación escalada
    console.error(JSON.stringify({ event: 'agente_error', error: String(e) }));
    await db.update(conversaciones).set({ estado: 'escalada' }).where(eq(conversaciones.id, conversacion.id));
    await responder(FALLBACK);
  }
}

export async function correrAgente(
  env: Env,
  db: Db,
  estilista: typeof estilistas.$inferSelect,
  clienta: typeof clientasFinales.$inferSelect,
  conversacionId: string,
  ctxTools: ContextoTools
): Promise<{ texto: string; tokens: { entrada: number; salida: number } }> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada');

  const config = await db.query.configAgente.findFirst({ where: eq(configAgente.estilistaId, estilista.id) });
  // Plantilla del system prompt editable por admin (fallback: la por defecto)
  const plantilla = (await db.query.configuracion.findFirst({ where: eq(configuracion.clave, 'system_prompt') }))?.valor;
  const system = construirSystemPrompt(
    {
    nombreNegocio: estilista.nombreNegocio,
    nombreEstilista: estilista.nombre,
    rubro: estilista.rubro,
    comuna: estilista.comuna,
    personalidad: config?.personalidad ?? 'cercana',
    instrucciones: config?.instrucciones ?? null,
    infoExtra: config?.infoExtra ?? null,
    servicios: await db.query.servicios.findMany({
      where: and(eq(servicios.estilistaId, estilista.id), eq(servicios.activo, true))
    }),
    horarios: await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilista.id) }),
    citasClienta: await db
      .select({ id: citas.id, fecha: citas.fecha, horaInicio: citas.horaInicio, servicio: servicios.nombre })
      .from(citas)
      .innerJoin(servicios, eq(citas.servicioId, servicios.id))
      .where(
        and(
          eq(citas.clientaId, clienta.id),
          eq(citas.estado, 'confirmada'),
          gte(citas.fecha, fechaLocalHoy())
        )
      ),
    nombreClienta: clienta.nombre
    },
    plantilla
  );

  const historial = await db.query.mensajes.findMany({
    where: eq(mensajes.conversacionId, conversacionId),
    orderBy: asc(mensajes.timestamp),
    limit: 1000
  });
  const recientes = historial.slice(-HISTORIAL_MAX);
  const turnos: Anthropic.MessageParam[] = recientes.map((m) => ({
    role: m.rol === 'agente' ? 'assistant' : 'user',
    content: m.rol === 'estilista' ? `[Mensaje de la estilista]: ${m.contenido}` : m.contenido
  }));
  while (turnos.length && turnos[0].role === 'assistant') turnos.shift();
  if (!turnos.length) throw new Error('Sin historial de conversación');

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const tokens = { entrada: 0, salida: 0 };

  for (let i = 0; i < MAX_ITERACIONES; i++) {
    console.log(JSON.stringify({ event: 'llm_llamada', iteracion: i }));
    const respuesta = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system,
      tools: TOOLS,
      messages: turnos
    });
    tokens.entrada += respuesta.usage.input_tokens;
    tokens.salida += respuesta.usage.output_tokens;

    if (respuesta.stop_reason !== 'tool_use') {
      const texto = respuesta.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return { texto: texto || FALLBACK, tokens };
    }

    turnos.push({ role: 'assistant', content: respuesta.content });
    const resultados: Anthropic.ToolResultBlockParam[] = [];
    for (const bloque of respuesta.content) {
      if (bloque.type !== 'tool_use') continue;
      const resultado = await ejecutarTool(ctxTools, bloque.name, bloque.input as Record<string, unknown>);
      resultados.push({ type: 'tool_result', tool_use_id: bloque.id, content: resultado });
    }
    turnos.push({ role: 'user', content: resultados });
  }

  return { texto: FALLBACK, tokens };
}

async function estilistaPorPhoneId(db: Db, phoneNumberId: string) {
  return db.query.estilistas.findFirst({ where: eq(estilistas.waPhoneNumberId, phoneNumberId) });
}

export function normalizarTelefono(waId: string): string {
  return waId.startsWith('+') ? waId : `+${waId}`;
}

export async function registrarConsumo(
  db: Db,
  estilistaId: string,
  mes: string,
  tokens: { entrada: number; salida: number },
  citasCreadas: number
): Promise<void> {
  const costoUsd = tokens.entrada * USD_POR_TOKEN_ENTRADA + tokens.salida * USD_POR_TOKEN_SALIDA;
  await db
    .insert(consumoMensual)
    .values({
      estilistaId,
      mes,
      mensajesAgente: 1,
      tokensEntrada: tokens.entrada,
      tokensSalida: tokens.salida,
      citasCreadas,
      costoEstimadoUsd: costoUsd
    })
    .onConflictDoUpdate({
      target: [consumoMensual.estilistaId, consumoMensual.mes],
      set: {
        mensajesAgente: sql`${consumoMensual.mensajesAgente} + 1`,
        tokensEntrada: sql`${consumoMensual.tokensEntrada} + ${tokens.entrada}`,
        tokensSalida: sql`${consumoMensual.tokensSalida} + ${tokens.salida}`,
        citasCreadas: sql`${consumoMensual.citasCreadas} + ${citasCreadas}`,
        costoEstimadoUsd: sql`${consumoMensual.costoEstimadoUsd} + ${costoUsd}`
      }
    });
}
