import { getDb, getEstilista } from '$lib/server/db';
import { eq, tiers } from '@tuhorafacil/db';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) redirect(303, '/login');

	const db = getDb(event);
	const estilista = (await getEstilista(db, event.locals.user.id)) ?? null;
	const tier = estilista ? await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) }) : null;
	const enOnboarding = event.url.pathname.startsWith('/app/onboarding');
	if (!estilista && !enOnboarding) redirect(303, '/app/onboarding');
	if (estilista && enOnboarding && event.url.searchParams.get('paso') === null) {
		redirect(303, '/app');
	}

	return { user: event.locals.user, estilista, tierNombre: tier?.nombre ?? null };
};
