import { slotsDisponibles } from '@tuhorafacil/core';
import { and, eq, horarios, servicios, type Db } from '@tuhorafacil/db';
import { bloqueosDelDia, citasDelDia } from './citas';
import { fechaLocalHoy, horaLocalAhora } from './fechas';

/** Slots reales de un servicio en una fecha — la única fuente de disponibilidad. */
export async function slotsParaServicio(
	db: Db,
	estilistaId: string,
	servicioId: string,
	fecha: string,
	intervaloMin?: number
): Promise<{ error: string } | { servicio: string; duracionMin: number; slots: string[] }> {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: 'Fecha inválida (formato YYYY-MM-DD).' };

	const servicio = await db.query.servicios.findFirst({
		where: and(eq(servicios.id, servicioId), eq(servicios.estilistaId, estilistaId), eq(servicios.activo, true))
	});
	if (!servicio) return { error: 'Servicio no encontrado.' };

	const slots = slotsDisponibles({
		fecha,
		duracionMin: servicio.duracionMin,
		horarios: await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilistaId) }),
		citas: await citasDelDia(db, estilistaId, fecha),
		bloqueos: await bloqueosDelDia(db, estilistaId, fecha),
		ahora: { fecha: fechaLocalHoy(), hora: horaLocalAhora() },
		intervaloMin
	});

	return { servicio: servicio.nombre, duracionMin: servicio.duracionMin, slots };
}
