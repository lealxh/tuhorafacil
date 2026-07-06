import { getDb } from '$lib/server/db';
import { fechaLocalHoy } from '@tuhorafacil/agenda';
import { and, asc, consumoMensual, eq, tiers } from '@tuhorafacil/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	const db = getDb(event);

	return {
		tierActualId: estilista.tierId,
		tiers: await db.query.tiers.findMany({ orderBy: asc(tiers.precioUsd) }),
		consumo: await db.query.consumoMensual.findFirst({
			where: and(eq(consumoMensual.estilistaId, estilista.id), eq(consumoMensual.mes, fechaLocalHoy().slice(0, 7)))
		})
	};
};
