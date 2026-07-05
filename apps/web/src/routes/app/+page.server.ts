import { getAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { fechaLocalHoy } from '$lib/server/fechas';
import { and, asc, citas, clientasFinales, eq, ne, servicios } from '@tuhorafacil/db';
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

	return { hoy, citasHoy };
};

export const actions: Actions = {
	logout: async (event) => {
		const auth = getAuth(event.platform!.env);
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/login');
	}
};
