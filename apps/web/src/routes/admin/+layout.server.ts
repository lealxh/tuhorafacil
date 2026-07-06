import { esAdmin, getDb } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) redirect(303, '/login');
	const db = getDb(event);
	if (!(await esAdmin(db, event.locals.user.id))) error(403, 'No autorizado');
	return { user: event.locals.user };
};
