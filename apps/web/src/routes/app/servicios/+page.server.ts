import { getDb, getEstilista } from '$lib/server/db';
import { crearServicio, eliminarServicio, toggleServicio } from '$lib/server/servicios';
import { asc, eq, servicios } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	return {
		servicios: await getDb(event).query.servicios.findMany({
			where: eq(servicios.estilistaId, estilista.id),
			orderBy: asc(servicios.nombre)
		})
	};
};

async function contexto(event: RequestEvent) {
	const db = getDb(event);
	const estilista = await getEstilista(db, event.locals.user!.id);
	if (!estilista) error(400, 'Sin negocio configurado');
	return { db, estilista };
}

export const actions: Actions = {
	agregar: async (event) => {
		const { db, estilista } = await contexto(event);
		const resultado = await crearServicio(db, estilista.id, await event.request.formData());
		if (resultado) return fail(400, resultado);
	},
	eliminar: async (event) => {
		const { db, estilista } = await contexto(event);
		await eliminarServicio(db, estilista.id, String((await event.request.formData()).get('id') ?? ''));
	},
	toggle: async (event) => {
		const { db, estilista } = await contexto(event);
		await toggleServicio(db, estilista.id, String((await event.request.formData()).get('id') ?? ''));
	}
};
