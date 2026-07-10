import { contextoEstilista as contexto, getDb } from '$lib/server/db';
import {
	bloqueosDelDia,
	cancelarCita,
	crearBloqueo,
	crearCita,
	editarCita,
	eliminarBloqueo
} from '@tuhorafacil/agenda';
import { fechaLocalHoy } from '@tuhorafacil/agenda';
import { diaSemanaDe, sumarDias } from '@tuhorafacil/core';
import {
	and,
	asc,
	citas,
	clientasFinales,
	eq,
	gte,
	horarios,
	lte,
	ne,
	servicios
} from '@tuhorafacil/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Vista = 'dia' | 'semana' | 'mes';

function rangoDe(vista: Vista, fecha: string): { desde: string; hasta: string } {
	if (vista === 'dia') return { desde: fecha, hasta: fecha };
	if (vista === 'semana') {
		const lunes = sumarDias(fecha, -((diaSemanaDe(fecha) + 6) % 7));
		return { desde: lunes, hasta: sumarDias(lunes, 6) };
	}
	const desde = `${fecha.slice(0, 7)}-01`;
	const [y, m] = fecha.split('-').map(Number);
	const ultimoDia = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
	return { desde, hasta: ultimoDia };
}

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');

	const hoy = fechaLocalHoy();
	const vistaParam = event.url.searchParams.get('vista');
	const vista: Vista = vistaParam === 'semana' || vistaParam === 'mes' ? vistaParam : 'dia';
	const fechaParam = event.url.searchParams.get('fecha') ?? '';
	const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : hoy;

	const db = getDb(event);
	const { desde, hasta } = rangoDe(vista, fecha);

	return {
		vista,
		fecha,
		hoy,
		citas: await db
			.select({
				id: citas.id,
				fecha: citas.fecha,
				horaInicio: citas.horaInicio,
				horaFin: citas.horaFin,
				origen: citas.origen,
				servicioId: citas.servicioId,
				clienta: clientasFinales.nombre,
				servicio: servicios.nombre
			})
			.from(citas)
			.innerJoin(clientasFinales, eq(citas.clientaId, clientasFinales.id))
			.innerJoin(servicios, eq(citas.servicioId, servicios.id))
			.where(
				and(
					eq(citas.estilistaId, estilista.id),
					gte(citas.fecha, desde),
					lte(citas.fecha, hasta),
					ne(citas.estado, 'cancelada')
				)
			)
			.orderBy(asc(citas.fecha), asc(citas.horaInicio)),
		bloqueos: vista === 'dia' ? await bloqueosDelDia(db, estilista.id, fecha) : [],
		horarios: await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilista.id) }),
		serviciosActivos: await db.query.servicios.findMany({
			where: and(eq(servicios.estilistaId, estilista.id), eq(servicios.activo, true)),
			orderBy: asc(servicios.nombre)
		})
	};
};

export const actions: Actions = {
	crear: async (event) => {
		const { db, estilista } = await contexto(event);
		const datos = await event.request.formData();
		const resultado = await crearCita(db, estilista.id, {
			clientaNombre: String(datos.get('clientaNombre') ?? '').trim(),
			telefono: String(datos.get('telefono') ?? '').trim(),
			servicioId: String(datos.get('servicioId') ?? ''),
			fecha: String(datos.get('fecha') ?? ''),
			horaInicio: String(datos.get('horaInicio') ?? ''),
			origen: 'manual'
		});
		if ('error' in resultado) return fail(400, { sheet: 'crear', error: resultado.error });
		return { creada: true };
	},

	editar: async (event) => {
		const { db, estilista } = await contexto(event);
		const datos = await event.request.formData();
		const resultado = await editarCita(db, estilista.id, String(datos.get('id') ?? ''), {
			servicioId: String(datos.get('servicioId') ?? ''),
			fecha: String(datos.get('fecha') ?? ''),
			horaInicio: String(datos.get('horaInicio') ?? '')
		});
		if ('error' in resultado) return fail(400, { sheet: 'editar', error: resultado.error });
		return { editada: true };
	},

	cancelar: async (event) => {
		const { db, estilista } = await contexto(event);
		await cancelarCita(db, estilista.id, String((await event.request.formData()).get('id') ?? ''));
	},

	bloquear: async (event) => {
		const { db, estilista } = await contexto(event);
		const datos = await event.request.formData();
		const resultado = await crearBloqueo(db, estilista.id, {
			fecha: String(datos.get('fecha') ?? ''),
			desde: String(datos.get('desde') ?? ''),
			hasta: String(datos.get('hasta') ?? ''),
			motivo: String(datos.get('motivo') ?? '').trim()
		});
		if (resultado) return fail(400, { sheet: 'bloquear', error: resultado.error });
		return { bloqueado: true };
	},

	desbloquear: async (event) => {
		const { db, estilista } = await contexto(event);
		await eliminarBloqueo(
			db,
			estilista.id,
			String((await event.request.formData()).get('id') ?? '')
		);
	}
};
