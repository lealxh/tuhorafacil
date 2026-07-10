import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(303, '/app');
	const filas = await getDb(event).query.tiers.findMany();
	return { preciosUsd: Object.fromEntries(filas.map((t) => [t.nombre, t.precioUsd])) };
};
