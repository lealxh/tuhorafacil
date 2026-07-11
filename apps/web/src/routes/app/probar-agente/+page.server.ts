import { llamarApi } from '$lib/server/api';
import { getDb, getEstilista } from '$lib/server/db';
import { and, asc, clientasFinales, conversaciones, eq, mensajes } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

// Debe coincidir con TELEFONO_PRUEBA del canal de prueba en apps/api
const TELEFONO_PRUEBA = 'WEB_DEMO';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	const db = getDb(event);

	const clienta = await db.query.clientasFinales.findFirst({
		where: and(
			eq(clientasFinales.estilistaId, estilista.id),
			eq(clientasFinales.telefono, TELEFONO_PRUEBA)
		)
	});
	const conversacion = clienta
		? await db.query.conversaciones.findFirst({
				where: and(
					eq(conversaciones.estilistaId, estilista.id),
					eq(conversaciones.clientaId, clienta.id)
				)
			})
		: null;

	return {
		mensajes: conversacion
			? (
					await db.query.mensajes.findMany({
						where: eq(mensajes.conversacionId, conversacion.id),
						orderBy: asc(mensajes.timestamp)
					})
				).map((m) => ({ rol: m.rol, contenido: m.contenido }))
			: []
	};
};

async function contexto(event: RequestEvent) {
	const db = getDb(event);
	const estilista = await getEstilista(db, event.locals.user!.id);
	if (!estilista) error(400, 'Sin negocio configurado');
	const env = event.platform!.env;
	return { estilista, env };
}

export const actions: Actions = {
	enviar: async (event) => {
		const { estilista, env } = await contexto(event);
		const texto = String((await event.request.formData()).get('texto') ?? '').trim();
		if (!texto) return fail(400, { error: 'Escribe un mensaje' });

		const res = await llamarApi(env, '/mock/chat', { estilistaId: estilista.id, texto });
		if (!res.ok) return fail(502, { error: 'No se pudo contactar al agente' });
		return { enviado: true };
	},

	reset: async (event) => {
		const { estilista, env } = await contexto(event);
		await llamarApi(env, '/mock/chat/reset', { estilistaId: estilista.id });
		return { reiniciado: true };
	}
};
