import { getAuth } from '$lib/server/auth';
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
import type { Actions, PageServerLoad } from './$types';

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
		const [escaladas] = await db
			.select({ n: sql<number>`count(*)` })
			.from(conversaciones)
			.where(and(eq(conversaciones.estilistaId, estilista.id), eq(conversaciones.estado, 'escalada')));
		agente = { mensajesHoy: mensajesHoy.n, citasHoy: citasAgenteHoy.n, escaladas: escaladas.n };
	}

	return { hoy, citasHoy, agente };
};

export const actions: Actions = {
	logout: async (event) => {
		const auth = getAuth(event.platform!.env);
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/login');
	}
};
