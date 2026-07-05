import { getDb, getEstilista } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) redirect(303, '/login');

	const estilista = (await getEstilista(getDb(event), event.locals.user.id)) ?? null;
	const enOnboarding = event.url.pathname.startsWith('/app/onboarding');
	if (!estilista && !enOnboarding) redirect(303, '/app/onboarding');
	if (estilista && enOnboarding && event.url.searchParams.get('paso') === null) {
		redirect(303, '/app');
	}

	return { user: event.locals.user, estilista };
};
