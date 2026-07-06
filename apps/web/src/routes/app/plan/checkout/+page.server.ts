import { getDb, getEstilista } from '$lib/server/db';
import { montoClp } from '$lib/plan';
import { eq, estilistas, suscripciones, tiers } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

const NOMBRES_VALIDOS = ['agenda', 'recepcionista', 'pro'] as const;

async function tierDestino(event: RequestEvent, nombre: string | null) {
	if (!nombre || !NOMBRES_VALIDOS.includes(nombre as (typeof NOMBRES_VALIDOS)[number])) return null;
	const db = getDb(event);
	return db.query.tiers.findFirst({
		where: eq(tiers.nombre, nombre as (typeof NOMBRES_VALIDOS)[number])
	});
}

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');

	const tier = await tierDestino(event, event.url.searchParams.get('plan'));
	// Plan inválido o ya es el actual: volver al listado
	if (!tier || tier.id === estilista.tierId) redirect(303, '/app/plan');

	return {
		tier: { nombre: tier.nombre, precioUsd: Number(tier.precioUsd) },
		montoClp: montoClp(Number(tier.precioUsd))
	};
};

export const actions: Actions = {
	pagar: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');

		const nombre = String((await event.request.formData()).get('plan') ?? '');
		const tier = await tierDestino(event, nombre);
		if (!tier || tier.id === estilista.tierId) return fail(400, { error: 'Plan inválido' });

		// Mock: el pago siempre se aprueba. Aquí se enchufa la pasarela real (Webpay/Flow/…).
		const monto = montoClp(Number(tier.precioUsd));
		await db
			.insert(suscripciones)
			.values({ estilistaId: estilista.id, tierId: tier.id, montoClp: monto });
		await db.update(estilistas).set({ tierId: tier.id }).where(eq(estilistas.id, estilista.id));

		redirect(303, '/app/plan?exito=1');
	}
};
