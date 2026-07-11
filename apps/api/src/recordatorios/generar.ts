import { fechaLegible, fechaLocalHoy } from '@tuhorafacil/agenda';
import { sumarDias } from '@tuhorafacil/core';
import {
  and,
  citas,
  clientasFinales,
  createDb,
  eq,
  estilistas,
  isNull,
  recordatorios,
  servicios,
  tiers
} from '@tuhorafacil/db';

export function construirRecordatorio(datos: {
  clienta: string;
  fecha: string;
  hora: string;
  servicio: string;
  negocio: string;
}): string {
  return (
    `¡Hola ${datos.clienta}! 👋 Te recordamos tu hora de mañana ${fechaLegible(datos.fecha)} ` +
    `a las ${datos.hora} para ${datos.servicio} en ${datos.negocio}. ` +
    `¿Nos confirmas? 👇`
  );
}

/**
 * Genera los recordatorios para las citas de mañana de las cuentas con tier Pro.
 * Idempotente (un recordatorio por cita), así que el cron puede correr sin miedo.
 * Por ahora solo los persiste ('simulado'); el envío real por WhatsApp llega con
 * las plantillas aprobadas por Meta.
 */
export async function generarRecordatorios(env: Env, estilistaId?: string): Promise<number> {
  const db = createDb(env.DB);
  const manana = sumarDias(fechaLocalHoy(), 1);

  const condiciones = [
    eq(citas.fecha, manana),
    eq(citas.estado, 'confirmada'),
    eq(estilistas.estado, 'activa'),
    eq(tiers.tieneRecordatorios, true),
    isNull(recordatorios.id)
  ];
  if (estilistaId) condiciones.push(eq(citas.estilistaId, estilistaId));

  const pendientes = await db
    .select({
      citaId: citas.id,
      estilistaId: citas.estilistaId,
      clientaId: citas.clientaId,
      horaInicio: citas.horaInicio,
      clienta: clientasFinales.nombre,
      servicio: servicios.nombre,
      negocio: estilistas.nombreNegocio
    })
    .from(citas)
    .innerJoin(estilistas, eq(citas.estilistaId, estilistas.id))
    .innerJoin(tiers, eq(estilistas.tierId, tiers.id))
    .innerJoin(clientasFinales, eq(citas.clientaId, clientasFinales.id))
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .leftJoin(recordatorios, eq(recordatorios.citaId, citas.id))
    .where(and(...condiciones));

  for (const cita of pendientes) {
    await db.insert(recordatorios).values({
      estilistaId: cita.estilistaId,
      citaId: cita.citaId,
      clientaId: cita.clientaId,
      contenido: construirRecordatorio({
        clienta: cita.clienta,
        fecha: manana,
        hora: cita.horaInicio,
        servicio: cita.servicio,
        negocio: cita.negocio
      })
    });
  }

  console.log(JSON.stringify({ event: 'recordatorios_generados', fecha: manana, cantidad: pendientes.length }));
  return pendientes.length;
}
