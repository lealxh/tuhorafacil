import { getDb } from '$lib/server/db';
import { fechaLocalHoy } from '@tuhorafacil/agenda';
import { and, asc, consumoMensual, eq, estilistas, tiers, user } from '@tuhorafacil/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const db = getDb(event);
	const mes = fechaLocalHoy().slice(0, 7);

	const cuentas = await db
		.select({
			id: estilistas.id,
			nombreNegocio: estilistas.nombreNegocio,
			email: user.email,
			estado: estilistas.estado,
			waEstado: estilistas.waEstado,
			tierId: estilistas.tierId,
			tierNombre: tiers.nombre,
			mensajes: consumoMensual.mensajesAgente,
			costoUsd: consumoMensual.costoEstimadoUsd
		})
		.from(estilistas)
		.innerJoin(user, eq(estilistas.userId, user.id))
		.innerJoin(tiers, eq(estilistas.tierId, tiers.id))
		.leftJoin(
			consumoMensual,
			and(eq(consumoMensual.estilistaId, estilistas.id), eq(consumoMensual.mes, mes))
		)
		.orderBy(asc(estilistas.nombreNegocio));

	return { cuentas, tiers: await db.query.tiers.findMany({ orderBy: asc(tiers.precioUsd) }) };
};

export const actions: Actions = {
	cambiarTier: async (event) => {
		const db = getDb(event);
		const datos = await event.request.formData();
		const estilistaId = String(datos.get('estilistaId') ?? '');
		const tierId = String(datos.get('tierId') ?? '');
		const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, tierId) });
		if (!tier) return fail(400, { error: 'Plan inválido' });
		await db.update(estilistas).set({ tierId }).where(eq(estilistas.id, estilistaId));
	},

	// Fallback manual de soporte: asocia (o desconecta) el phone_number_id de Kapso.
	// No registra el webhook del número en Kapso — para eso está el flujo self-service.
	conectarWa: async (event) => {
		const db = getDb(event);
		const datos = await event.request.formData();
		const estilistaId = String(datos.get('estilistaId') ?? '');
		const phoneNumberId = String(datos.get('phoneNumberId') ?? '').trim();
		await db
			.update(estilistas)
			.set(
				phoneNumberId
					? { waPhoneNumberId: phoneNumberId, waEstado: 'activo' }
					: { waPhoneNumberId: null, waEstado: 'desconectado' }
			)
			.where(eq(estilistas.id, estilistaId));
	},

	pausar: async (event) => {
		const db = getDb(event);
		const estilistaId = String((await event.request.formData()).get('estilistaId') ?? '');
		await db.update(estilistas).set({ estado: 'pausada' }).where(eq(estilistas.id, estilistaId));
	},

	reactivar: async (event) => {
		const db = getDb(event);
		const estilistaId = String((await event.request.formData()).get('estilistaId') ?? '');
		await db.update(estilistas).set({ estado: 'activa' }).where(eq(estilistas.id, estilistaId));
	}
};
