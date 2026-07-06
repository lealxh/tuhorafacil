import { getDb } from '$lib/server/db';
import { crearCita, fechaLocalHoy, slotsParaServicio } from '@tuhorafacil/agenda';
import { diaSemanaDe, sumarDias } from '@tuhorafacil/core';
import { and, asc, eq, estilistas, horarios, servicios } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const DIAS_VISIBLES = 14;

async function cargarEstilista(event: { params: { slug: string }; platform?: unknown }) {
	const db = getDb(event as Parameters<typeof getDb>[0]);
	const estilista = await db.query.estilistas.findFirst({
		where: and(eq(estilistas.slugPublico, event.params.slug.slice(1)), eq(estilistas.estado, 'activa'))
	});
	if (!estilista) error(404, 'Página no encontrada');
	return { db, estilista };
}

export const load: PageServerLoad = async (event) => {
	const { db, estilista } = await cargarEstilista(event);

	const serviciosActivos = await db.query.servicios.findMany({
		where: and(eq(servicios.estilistaId, estilista.id), eq(servicios.activo, true)),
		orderBy: asc(servicios.nombre)
	});

	const servicioId = event.url.searchParams.get('servicio') ?? '';
	const servicio = serviciosActivos.find((s) => s.id === servicioId) ?? null;

	const exito = event.url.searchParams.get('exito');
	if (exito) {
		return {
			negocio: estilista.nombreNegocio,
			servicios: serviciosActivos,
			servicio,
			exito: {
				servicio: event.url.searchParams.get('s') ?? '',
				fecha: event.url.searchParams.get('f') ?? '',
				hora: event.url.searchParams.get('h') ?? ''
			},
			dias: [],
			fecha: '',
			slots: []
		};
	}

	const hoy = fechaLocalHoy();
	const diasAbiertos = new Set((await db.query.horarios.findMany({ where: eq(horarios.estilistaId, estilista.id) })).map((h) => h.diaSemana));
	const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => {
		const fecha = sumarDias(hoy, i);
		return { fecha, abierto: diasAbiertos.has(diaSemanaDe(fecha)) };
	});

	const fechaParam = event.url.searchParams.get('fecha') ?? '';
	const fecha = dias.some((d) => d.fecha === fechaParam && d.abierto)
		? fechaParam
		: (dias.find((d) => d.abierto)?.fecha ?? hoy);

	let slots: string[] = [];
	if (servicio) {
		const r = await slotsParaServicio(db, estilista.id, servicio.id, fecha, 30);
		if (!('error' in r)) slots = r.slots;
	}

	return { negocio: estilista.nombreNegocio, servicios: serviciosActivos, servicio, exito: null, dias, fecha, slots };
};

export const actions: Actions = {
	reservar: async (event) => {
		const { db, estilista } = await cargarEstilista(event);
		const datos = await event.request.formData();
		const nombre = String(datos.get('nombre') ?? '').trim();
		const telefono = String(datos.get('telefono') ?? '').trim();
		const servicioId = String(datos.get('servicio') ?? '');
		const fecha = String(datos.get('fecha') ?? '');
		const hora = String(datos.get('hora') ?? '');

		if (!nombre || !/^\+?[\d\s]{8,15}$/.test(telefono)) {
			return fail(400, { error: 'Ingresa tu nombre y un teléfono válido (con WhatsApp).' });
		}

		const resultado = await crearCita(db, estilista.id, {
			clientaNombre: nombre,
			telefono: telefono.replace(/\s/g, '').startsWith('+') ? telefono.replace(/\s/g, '') : `+${telefono.replace(/\s/g, '')}`,
			servicioId,
			fecha,
			horaInicio: hora,
			origen: 'web'
		});
		// Los mensajes de crearCita hablan a la estilista; aquí habla la clienta
		if ('error' in resultado) {
			return fail(400, { error: 'Esa hora ya no está disponible 😔 Elige otra, porfa.' });
		}

		const servicio = await db.query.servicios.findFirst({ where: eq(servicios.id, servicioId) });
		const q = new URLSearchParams({ exito: '1', s: servicio?.nombre ?? '', f: fecha, h: hora });
		redirect(303, `/${event.params.slug}/reservar?${q}`);
	}
};
