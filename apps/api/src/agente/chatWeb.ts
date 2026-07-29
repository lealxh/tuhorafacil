import { fechaLocalHoy } from '@tuhorafacil/agenda';
import {
  and,
  asc,
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

// Chat del agente en la página pública de la estilista. La clienta es anónima:
// se identifica por un token de sesión del navegador (clienta placeholder 'web:<token>').
// El agente pide nombre y teléfono al agendar; la cita real la crea crearCita por ese teléfono.

export type ResultadoChat = { texto: string; gate?: boolean };

const RE_SESION = /^[A-Za-z0-9_-]{8,64}$/;
type Db = ReturnType<typeof createDb>;

export async function chatWebMensaje(
  env: Env,
  estilistaId: string,
  sesion: string,
  texto: string
): Promise<ResultadoChat> {
  if (!RE_SESION.test(sesion)) return { texto: 'Sesión inválida.', gate: true };
  const db = createDb(env.DB);

  const estilista = await db.query.estilistas.findFirst({ where: eq(estilistas.id, estilistaId) });
  if (!estilista) return { texto: 'No se encontró el negocio.', gate: true };

  const { clienta, conversacionId } = await asegurarConversacionWeb(db, estilista.id, sesion);
  await db.insert(mensajes).values({ conversacionId, rol: 'clienta', contenido: texto });

  // Gates: estado de la cuenta, plan con agente, agente activo, límite mensual del plan
  if (estilista.estado !== 'activa') {
    return gate(db, conversacionId, 'Este negocio no está atendiendo por aquí ahora.');
  }
  const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
  if (!tier?.tieneAgente) {
    return gate(db, conversacionId, 'Este negocio no tiene chat en línea. Puedes reservar con el botón de arriba 🙂');
  }
  const config = await db.query.configAgente.findFirst({ where: eq(configAgente.estilistaId, estilista.id) });
  if (config && !config.activo) {
    return gate(db, conversacionId, 'El asistente está en pausa por ahora. Puedes reservar con el botón de arriba 🙂');
  }

  const mes = fechaLocalHoy().slice(0, 7);
  if (tier.limiteMensajesMes != null) {
    const consumo = await db.query.consumoMensual.findFirst({
      where: and(eq(consumoMensual.estilistaId, estilista.id), eq(consumoMensual.mes, mes))
    });
    if ((consumo?.mensajesAgente ?? 0) >= tier.limiteMensajesMes) {
      return gate(db, conversacionId, 'Por ahora no puedo responder por aquí 🙏 Puedes reservar con el botón de arriba.');
    }
  }

  const ctxTools: ContextoTools = {
    db,
    estilistaId: estilista.id,
    clientaId: clienta.id,
    telefono: `web:${sesion}`,
    conversacionId,
    origen: 'web',
    citasCreadas: { count: 0 },
    agendo: { valor: false }
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
    console.error(JSON.stringify({ event: 'chat_web_error', error: String(e) }));
    const fallback = 'Se me complicó responder ahora 🙏 Puedes reservar con el botón de arriba.';
    await db.insert(mensajes).values({ conversacionId, rol: 'agente', contenido: fallback });
    return { texto: fallback, gate: true };
  }
}

export async function historialWeb(
  env: Env,
  estilistaId: string,
  sesion: string
): Promise<Array<{ rol: string; contenido: string }>> {
  if (!RE_SESION.test(sesion)) return [];
  const db = createDb(env.DB);
  const clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilistaId), eq(clientasFinales.telefono, `web:${sesion}`))
  });
  if (!clienta) return [];
  const conversacion = await db.query.conversaciones.findFirst({
    where: and(eq(conversaciones.estilistaId, estilistaId), eq(conversaciones.clientaId, clienta.id))
  });
  if (!conversacion) return [];
  return (
    await db.query.mensajes.findMany({
      where: eq(mensajes.conversacionId, conversacion.id),
      orderBy: asc(mensajes.timestamp)
    })
  ).map((m) => ({ rol: m.rol, contenido: m.contenido }));
}

async function asegurarConversacionWeb(db: Db, estilistaId: string, sesion: string) {
  const telefono = `web:${sesion}`;
  let clienta = await db.query.clientasFinales.findFirst({
    where: and(eq(clientasFinales.estilistaId, estilistaId), eq(clientasFinales.telefono, telefono))
  });
  clienta ??= (
    await db.insert(clientasFinales).values({ estilistaId, nombre: 'Visitante', telefono }).returning()
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

async function gate(db: Db, conversacionId: string, texto: string): Promise<ResultadoChat> {
  await db.insert(mensajes).values({ conversacionId, rol: 'agente', contenido: texto });
  return { texto, gate: true };
}
