import { contextoEstilista as contexto, getDb } from '$lib/server/db';
import { fechaLocalHoy } from '@tuhorafacil/agenda';
import {
	and,
	clientasFinales,
	configAgente,
	consumoMensual,
	conversaciones,
	desc,
	eq,
	mensajes,
	tiers,
	type Db
} from '@tuhorafacil/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	const db = getDb(event);

	const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
	const mes = fechaLocalHoy().slice(0, 7);

	const escaladas = await db
		.select({ id: conversaciones.id, clienta: clientasFinales.nombre, ultimoMensajeAt: conversaciones.ultimoMensajeAt })
		.from(conversaciones)
		.innerJoin(clientasFinales, eq(conversaciones.clientaId, clientasFinales.id))
		.where(and(eq(conversaciones.estilistaId, estilista.id), eq(conversaciones.estado, 'escalada')))
		.orderBy(desc(conversaciones.ultimoMensajeAt));

	const conMensajes = await Promise.all(
		escaladas.map(async (conv) => ({
			...conv,
			mensajes: (
				await db.query.mensajes.findMany({
					where: eq(mensajes.conversacionId, conv.id),
					orderBy: desc(mensajes.timestamp),
					limit: 4
				})
			)
				.reverse()
				.map((m) => ({ rol: m.rol, contenido: m.contenido }))
		}))
	);

	return {
		tieneAgente: tier?.tieneAgente ?? false,
		limiteMensajes: tier?.limiteMensajesMes ?? null,
		config: await db.query.configAgente.findFirst({ where: eq(configAgente.estilistaId, estilista.id) }),
		consumo: await db.query.consumoMensual.findFirst({
			where: and(eq(consumoMensual.estilistaId, estilista.id), eq(consumoMensual.mes, mes))
		}),
		escaladas: conMensajes
	};
};

async function upsertConfig(db: Db, estilistaId: string, valores: Partial<typeof configAgente.$inferInsert>) {
	await db
		.insert(configAgente)
		.values({ estilistaId, ...valores })
		.onConflictDoUpdate({ target: configAgente.estilistaId, set: valores });
}

export const actions: Actions = {
	toggle: async (event) => {
		const { db, estilista } = await contexto(event);
		const activo = String((await event.request.formData()).get('activo')) === 'true';
		await upsertConfig(db, estilista.id, { activo });
	},

	personalidad: async (event) => {
		const { db, estilista } = await contexto(event);
		const valor = String((await event.request.formData()).get('personalidad'));
		if (!['cercana', 'neutral', 'formal'].includes(valor)) return fail(400, { error: 'Personalidad inválida' });
		await upsertConfig(db, estilista.id, { personalidad: valor });
	},

	instrucciones: async (event) => {
		const { db, estilista } = await contexto(event);
		const datos = await event.request.formData();
		await upsertConfig(db, estilista.id, {
			instrucciones: String(datos.get('instrucciones') ?? '').trim() || null,
			infoExtra: String(datos.get('infoExtra') ?? '').trim() || null
		});
		return { guardado: true };
	},

	// La conversación vuelve al agente
	seguirAgente: async (event) => {
		const { db, estilista } = await contexto(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		await db
			.update(conversaciones)
			.set({ estado: 'activa', agentePausadoHasta: null })
			.where(and(eq(conversaciones.id, id), eq(conversaciones.estilistaId, estilista.id)));
	},

	// La estilista responde personalmente: agente en pausa 1 hora en esa conversación
	responderYo: async (event) => {
		const { db, estilista } = await contexto(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		await db
			.update(conversaciones)
			.set({ estado: 'activa', agentePausadoHasta: new Date(Date.now() + 60 * 60 * 1000) })
			.where(and(eq(conversaciones.id, id), eq(conversaciones.estilistaId, estilista.id)));
	}
};
