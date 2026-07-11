import { llamarApi } from '$lib/server/api';
import { contextoEstilista, getDb } from '$lib/server/db';
import {
	and,
	citas,
	clientasFinales,
	desc,
	eq,
	recordatorios,
	servicios,
	tiers
} from '@tuhorafacil/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	const db = getDb(event);

	const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });

	return {
		tieneRecordatorios: tier?.tieneRecordatorios ?? false,
		recordatorios: await db
			.select({
				id: recordatorios.id,
				contenido: recordatorios.contenido,
				estado: recordatorios.estado,
				respuesta: recordatorios.respuesta,
				clienta: clientasFinales.nombre,
				fecha: citas.fecha,
				horaInicio: citas.horaInicio,
				servicio: servicios.nombre
			})
			.from(recordatorios)
			.innerJoin(citas, eq(recordatorios.citaId, citas.id))
			.innerJoin(clientasFinales, eq(recordatorios.clientaId, clientasFinales.id))
			.innerJoin(servicios, eq(citas.servicioId, servicios.id))
			.where(eq(recordatorios.estilistaId, estilista.id))
			.orderBy(desc(recordatorios.createdAt))
	};
};

export const actions: Actions = {
	generar: async (event) => {
		const { estilista } = await contextoEstilista(event);
		const res = await llamarApi(event.platform!.env, '/mock/recordatorios', {
			estilistaId: estilista.id
		});
		if (!res.ok) return fail(502, { error: 'No se pudieron generar los recordatorios' });
		const { generados } = (await res.json()) as { generados: number };
		return { generados };
	},

	// Simula a la clienta tocando un botón del mensaje (hasta que exista el canal real)
	responder: async (event) => {
		const { estilista, db } = await contextoEstilista(event);
		const datos = await event.request.formData();
		const id = String(datos.get('id') ?? '');
		const respuesta = String(datos.get('respuesta') ?? '');
		if (respuesta !== 'confirmada' && respuesta !== 'reagendar') {
			return fail(400, { error: 'Respuesta inválida' });
		}
		await db
			.update(recordatorios)
			.set({ respuesta, respondidoAt: new Date() })
			.where(and(eq(recordatorios.id, id), eq(recordatorios.estilistaId, estilista.id)));
		return { respondido: true };
	}
};
