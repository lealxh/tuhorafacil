import { fechaLocalHoy } from '@tuhorafacil/agenda';
import {
  and,
  clientasFinales,
  configAgente,
  consumoMensual,
  conversaciones,
  createDb,
  eq,
  estilistas,
  mensajes,
  tiers
} from '@tuhorafacil/db';
import { correrAgente, registrarConsumo } from './orquestador';
import type { ContextoTools } from './tools';

// Canal de prueba en el navegador: una "clienta" sintética fija por estilista.
// No hay WhatsApp de por medio, así que se omite el gate de waEstado; el resto
// del gating (tier, agente activo, límite mensual) se aplica igual para poder
// probar el comportamiento real del agente.
const TELEFONO_PRUEBA = 'WEB_DEMO';
const NOMBRE_PRUEBA = 'Prueba (web)';

export type ResultadoSimulado = { texto: string; gate?: boolean };

/** Procesa un mensaje de prueba escrito desde el navegador y devuelve la respuesta del agente. */
export async function simularMensaje(env: Env, estilistaId: string, texto: string): Promise<ResultadoSimulado> {
  const db = createDb(env.DB);

  const estilista = await db.query.estilistas.findFirst({ where: eq(estilistas.id, estilistaId) });
  if (!estilista) return { texto: 'No se encontró la estilista.', gate: true };

  const { clienta, conversacionId } = await asegurarConversacion(db, estilista.id);
  await db.insert(mensajes).values({ conversacionId, rol: 'clienta', contenido: texto });

  // Gates (sin waEstado, que depende de WhatsApp): estado de la cuenta, tier, agente activo y límite mensual
  if (estilista.estado !== 'activa') {
    return gate(db, conversacionId, 'La cuenta está pausada. Reactívala para usar el agente.');
  }
  const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
  if (!tier?.tieneAgente) {
    return gate(db, conversacionId, 'Tu plan no incluye el agente. Cámbiate a Recepcionista o Pro para probarlo.');
  }
  const config = await db.query.configAgente.findFirst({ where: eq(configAgente.estilistaId, estilista.id) });
  if (config && !config.activo) {
    return gate(db, conversacionId, 'El agente está en pausa. Actívalo en «Mi agente» para probarlo.');
  }

  const mes = fechaLocalHoy().slice(0, 7);
  if (tier.limiteMensajesMes != null) {
    const consumo = await db.query.consumoMensual.findFirst({
      where: and(eq(consumoMensual.estilistaId, estilista.id), eq(consumoMensual.mes, mes))
    });
    if ((consumo?.mensajesAgente ?? 0) >= tier.limiteMensajesMes) {
      return gate(db, conversacionId, 'Alcanzaste el límite de mensajes del mes: el agente se pausó.');
    }
  }

  const ctxTools: ContextoTools = {
    db,
    estilistaId: estilista.id,
    clientaId: clienta.id,
    telefono: TELEFONO_PRUEBA,
    conversacionId,
    citasCreadas: { count: 0 }
  };

  try {
    const respuesta = await correrAgente(env, db, estilista, clienta, conversacionId, ctxTools);
    await db.insert(mensajes).values({
      conversacionId,
      rol: 'agente',
      contenido: respuesta.texto,
      tokensEntrada: respuesta.tokens.entrada,
      tokensSalida: respuesta.tokens.salida
    });
    await registrarConsumo(db, estilista.id, mes, respuesta.tokens, ctxTools.citasCreadas.count);
    return { texto: respuesta.texto };
  } catch (e) {
    console.error(JSON.stringify({ event: 'simular_error', error: String(e) }));
    const fallback = 'El agente no está disponible ahora (revisa ANTHROPIC_API_KEY).';
    await db.insert(mensajes).values({ conversacionId, rol: 'agente', contenido: fallback });
    return { texto: fallback, gate: true };
  }
}

/** Elimina la conversación de prueba para empezar de cero. */
export async function reiniciarSimulacion(env: Env, estilistaId: string): Promise<void> {
  const db = createDb(env.DB);
  const clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilistaId), eq(clientasFinales.telefono, TELEFONO_PRUEBA))
  });
  if (!clienta) return;
  // mensajes cae por cascade al borrar la conversación
  await db
    .delete(conversaciones)
    .where(and(eq(conversaciones.estilistaId, estilistaId), eq(conversaciones.clientaId, clienta.id)));
}

async function asegurarConversacion(db: ReturnType<typeof createDb>, estilistaId: string) {
  let clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilistaId), eq(clientasFinales.telefono, TELEFONO_PRUEBA))
  });
  clienta ??= (
    await db
      .insert(clientasFinales)
      .values({ estilistaId, nombre: NOMBRE_PRUEBA, telefono: TELEFONO_PRUEBA })
      .returning()
  )[0];

  let conversacion = await db.query.conversaciones.findFirst({
    where: and(eq(conversaciones.estilistaId, estilistaId), eq(conversaciones.clientaId, clienta.id))
  });
  conversacion ??= (
    await db.insert(conversaciones).values({ estilistaId, clientaId: clienta.id }).returning()
  )[0];
  await db.update(conversaciones).set({ ultimoMensajeAt: new Date() }).where(eq(conversaciones.id, conversacion.id));

  return { clienta, conversacionId: conversacion.id };
}

async function gate(
  db: ReturnType<typeof createDb>,
  conversacionId: string,
  texto: string
): Promise<ResultadoSimulado> {
  await db.insert(mensajes).values({ conversacionId, rol: 'agente', contenido: texto });
  return { texto, gate: true };
}
