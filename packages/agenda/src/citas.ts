import {
	bloqueoEnFecha,
	finDeCita,
	sumarDias,
	validarCita,
	type MotivoRechazo,
	type RangoHorario
} from '@tuhorafacil/core';
import { and, bloqueos, citas, clientasFinales, eq, gte, horarios, lte, ne, servicios, sql, type Db } from '@tuhorafacil/db';
import { fechaLocalHoy, horaLocalAhora, TZ_NEGOCIO } from './fechas';

const MENSAJE_RECHAZO: Record<MotivoRechazo, string> = {
	fuera_de_horario: 'Esa hora queda fuera de tu horario de atención.',
	solapa_cita: 'Ya tienes una cita en ese horario.',
	solapa_bloqueo: 'Ese horario está bloqueado.',
	anticipacion_insuficiente: 'Esa hora no cumple la anticipación mínima.',
	en_el_pasado: 'Esa hora ya pasó.'
};

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^\d{2}:\d{2}$/;

/** Convierte fecha+hora local del negocio a instante UTC (dos pasadas por el DST chileno). */
export function instanteLocal(fecha: string, hora: string): Date {
	const supuesto = new Date(`${fecha}T${hora}:00Z`);
	const fmt = new Intl.DateTimeFormat('en-CA', {
		timeZone: TZ_NEGOCIO,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	const partes = Object.fromEntries(fmt.formatToParts(supuesto).map((p) => [p.type, p.value]));
	const leido = Date.UTC(
		Number(partes.year),
		Number(partes.month) - 1,
		Number(partes.day),
		partes.hour === '24' ? 0 : Number(partes.hour),
		Number(partes.minute)
	);
	return new Date(supuesto.getTime() - (leido - supuesto.getTime()));
}

/** Bloqueos del día recortados a rangos horarios locales. */
export async function bloqueosDelDia(db: Db, estilistaId: string, fecha: string) {
	const candidatos = await db.query.bloqueos.findMany({
		where: and(
			eq(bloqueos.estilistaId, estilistaId),
			lte(bloqueos.fechaInicio, new Date(`${sumarDias(fecha, 2)}T00:00:00Z`)),
			gte(bloqueos.fechaFin, new Date(`${sumarDias(fecha, -1)}T00:00:00Z`))
		)
	});
	return candidatos.flatMap((b) =>
		bloqueoEnFecha(b, fecha, TZ_NEGOCIO).map((rango) => ({ id: b.id, motivo: b.motivo, ...rango }))
	);
}

export async function citasDelDia(
	db: Db,
	estilistaId: string,
	fecha: string,
	excluirCitaId?: string
): Promise<RangoHorario[]> {
	const condiciones = [eq(citas.estilistaId, estilistaId), eq(citas.fecha, fecha), ne(citas.estado, 'cancelada')];
	// Al editar una cita, se excluye su propia fila para poder mantener el mismo horario
	if (excluirCitaId) condiciones.push(ne(citas.id, excluirCitaId));
	return db
		.select({ horaInicio: citas.horaInicio, horaFin: citas.horaFin })
		.from(citas)
		.where(and(...condiciones));
}

export interface NuevaCita {
	clientaNombre: string;
	telefono: string;
	servicioId: string;
	fecha: string;
	horaInicio: string;
	origen: 'manual' | 'agente' | 'web';
}

export async function crearCita(db: Db, estilistaId: string, cita: NuevaCita): Promise<{ error: string } | { id: string }> {
	if (!cita.clientaNombre || !cita.telefono) return { error: 'Ingresa nombre y teléfono de la clienta.' };
	if (!RE_FECHA.test(cita.fecha) || !RE_HORA.test(cita.horaInicio)) return { error: 'Revisa la fecha y la hora.' };

	const servicio = await db.query.servicios.findFirst({
		where: and(eq(servicios.id, cita.servicioId), eq(servicios.estilistaId, estilistaId), eq(servicios.activo, true))
	});
	if (!servicio) return { error: 'Elige un servicio.' };

	const motivo = validarCita({
		fecha: cita.fecha,
		horaInicio: cita.horaInicio,
		duracionMin: servicio.duracionMin,
		horarios: await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilistaId) }),
		citas: await citasDelDia(db, estilistaId, cita.fecha),
		bloqueos: await bloqueosDelDia(db, estilistaId, cita.fecha),
		ahora: { fecha: fechaLocalHoy(), hora: horaLocalAhora() }
	});
	if (motivo) return { error: MENSAJE_RECHAZO[motivo] };

	let clienta = await db.query.clientasFinales.findFirst({
		where: and(eq(clientasFinales.estilistaId, estilistaId), eq(clientasFinales.telefono, cita.telefono))
	});
	clienta ??= (
		await db
			.insert(clientasFinales)
			.values({ estilistaId, nombre: cita.clientaNombre, telefono: cita.telefono })
			.returning()
	)[0];

	// Inserción atómica: la verificación de conflicto va en el mismo statement.
	// D1 es single-writer, así que no puede colarse otra cita entre el chequeo y el insert.
	const id = crypto.randomUUID();
	const horaFin = finDeCita(cita.horaInicio, servicio.duracionMin);
	const resultado = await db.run(sql`
		INSERT INTO citas (id, estilista_id, clienta_id, servicio_id, fecha, hora_inicio, hora_fin, estado, origen, created_at)
		SELECT ${id}, ${estilistaId}, ${clienta.id}, ${servicio.id}, ${cita.fecha}, ${cita.horaInicio}, ${horaFin}, 'confirmada', ${cita.origen}, ${Date.now()}
		WHERE NOT EXISTS (
			SELECT 1 FROM citas
			WHERE estilista_id = ${estilistaId} AND fecha = ${cita.fecha} AND estado != 'cancelada'
				AND hora_inicio < ${horaFin} AND ${cita.horaInicio} < hora_fin
		)`);
	if (resultado.meta.changes === 0) return { error: MENSAJE_RECHAZO.solapa_cita };
	return { id };
}

export interface CambiosCita {
	servicioId?: string;
	fecha?: string;
	horaInicio?: string;
}

/**
 * Edita una cita confirmada in situ (misma fila, preserva origen). Recalcula
 * horaFin según la duración del servicio y valida excluyendo la propia cita.
 */
export async function editarCita(
	db: Db,
	estilistaId: string,
	citaId: string,
	cambios: CambiosCita
): Promise<{ error: string } | { ok: true }> {
	const cita = await db.query.citas.findFirst({
		where: and(eq(citas.id, citaId), eq(citas.estilistaId, estilistaId), eq(citas.estado, 'confirmada'))
	});
	if (!cita) return { error: 'No se encontró la cita.' };

	const servicioId = cambios.servicioId ?? cita.servicioId;
	const fecha = cambios.fecha ?? cita.fecha;
	const horaInicio = cambios.horaInicio ?? cita.horaInicio;
	if (!RE_FECHA.test(fecha) || !RE_HORA.test(horaInicio)) return { error: 'Revisa la fecha y la hora.' };

	const servicio = await db.query.servicios.findFirst({
		where: and(eq(servicios.id, servicioId), eq(servicios.estilistaId, estilistaId), eq(servicios.activo, true))
	});
	if (!servicio) return { error: 'Elige un servicio.' };

	const motivo = validarCita({
		fecha,
		horaInicio,
		duracionMin: servicio.duracionMin,
		horarios: await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilistaId) }),
		citas: await citasDelDia(db, estilistaId, fecha, citaId),
		bloqueos: await bloqueosDelDia(db, estilistaId, fecha),
		ahora: { fecha: fechaLocalHoy(), hora: horaLocalAhora() }
	});
	if (motivo) return { error: MENSAJE_RECHAZO[motivo] };

	// Update atómico con el mismo guard anti-solapamiento que crearCita, excluyendo la propia fila.
	const horaFin = finDeCita(horaInicio, servicio.duracionMin);
	const resultado = await db.run(sql`
		UPDATE citas SET servicio_id = ${servicioId}, fecha = ${fecha}, hora_inicio = ${horaInicio}, hora_fin = ${horaFin}
		WHERE id = ${citaId} AND estilista_id = ${estilistaId} AND estado = 'confirmada'
			AND NOT EXISTS (
				SELECT 1 FROM citas
				WHERE estilista_id = ${estilistaId} AND fecha = ${fecha} AND estado != 'cancelada' AND id != ${citaId}
					AND hora_inicio < ${horaFin} AND ${horaInicio} < hora_fin
			)`);
	if (resultado.meta.changes === 0) return { error: MENSAJE_RECHAZO.solapa_cita };
	return { ok: true };
}

export async function cancelarCita(db: Db, estilistaId: string, citaId: string) {
	await db
		.update(citas)
		.set({ estado: 'cancelada' })
		.where(and(eq(citas.id, citaId), eq(citas.estilistaId, estilistaId)));
}

export async function crearBloqueo(
	db: Db,
	estilistaId: string,
	datos: { fecha: string; desde: string; hasta: string; motivo: string }
): Promise<{ error: string } | null> {
	if (!RE_FECHA.test(datos.fecha) || !RE_HORA.test(datos.desde) || !RE_HORA.test(datos.hasta) || datos.desde >= datos.hasta) {
		return { error: 'Revisa la fecha y el rango de horas.' };
	}
	await db.insert(bloqueos).values({
		estilistaId,
		fechaInicio: instanteLocal(datos.fecha, datos.desde),
		fechaFin: instanteLocal(datos.fecha, datos.hasta),
		motivo: datos.motivo || null
	});
	return null;
}

export async function eliminarBloqueo(db: Db, estilistaId: string, bloqueoId: string) {
	await db.delete(bloqueos).where(and(eq(bloqueos.id, bloqueoId), eq(bloqueos.estilistaId, estilistaId)));
}
