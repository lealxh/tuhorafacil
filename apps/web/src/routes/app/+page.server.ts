import { getDb } from '$lib/server/db';
import { fechaLocalHoy, instanteLocal } from '@tuhorafacil/agenda';
import {
	and,
	asc,
	citas,
	clientasFinales,
	conversaciones,
	eq,
	gte,
	mensajes,
	ne,
	servicios,
	sql,
	tiers
} from '@tuhorafacil/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');

	const db = getDb(event);
	const hoy = fechaLocalHoy();

	const citasHoy = await db
		.select({
			id: citas.id,
			horaInicio: citas.horaInicio,
			estado: citas.estado,
			origen: citas.origen,
			clienta: clientasFinales.nombre,
			servicio: servicios.nombre,
			duracionMin: servicios.duracionMin,
			precio: servicios.precio
		})
		.from(citas)
		.innerJoin(clientasFinales, eq(citas.clientaId, clientasFinales.id))
		.innerJoin(servicios, eq(citas.servicioId, servicios.id))
		.where(and(eq(citas.estilistaId, estilista.id), eq(citas.fecha, hoy), ne(citas.estado, 'cancelada')))
		.orderBy(asc(citas.horaInicio));

	const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
	let agente = null;
	if (tier?.tieneAgente) {
		const inicioDia = instanteLocal(hoy, '00:00');
		const [mensajesHoy] = await db
			.select({ n: sql<number>`count(*)` })
			.from(mensajes)
			.innerJoin(conversaciones, eq(mensajes.conversacionId, conversaciones.id))
			.where(and(eq(conversaciones.estilistaId, estilista.id), eq(mensajes.rol, 'agente'), gte(mensajes.timestamp, inicioDia)));
		const [citasAgenteHoy] = await db
			.select({ n: sql<number>`count(*)` })
			.from(citas)
			.where(and(eq(citas.estilistaId, estilista.id), eq(citas.origen, 'agente'), gte(citas.createdAt, inicioDia)));
		const escaladas = await db
			.select({
				id: conversaciones.id,
				clienta: clientasFinales.nombre,
				snippet: sql<string>`(SELECT contenido FROM mensajes WHERE conversacion_id = ${conversaciones.id} ORDER BY timestamp DESC LIMIT 1)`
			})
			.from(conversaciones)
			.innerJoin(clientasFinales, eq(conversaciones.clientaId, clientasFinales.id))
			.where(and(eq(conversaciones.estilistaId, estilista.id), eq(conversaciones.estado, 'escalada')))
			.limit(4);
		agente = { mensajesHoy: mensajesHoy.n, citasHoy: citasAgenteHoy.n, escaladas };
	}

	return { hoy, citasHoy, agente };
};

