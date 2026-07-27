import { llamarApi } from '$lib/server/api';
import { getDb } from '$lib/server/db';
import { and, eq, estilistas, tiers } from '@tuhorafacil/db';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Resuelve la estilista por slug y exige que su plan tenga agente.
async function estilistaConAgente(event: RequestEvent) {
	const db = getDb(event);
	const estilista = await db.query.estilistas.findFirst({
		where: and(eq(estilistas.slugPublico, event.params.slug!.slice(1)), eq(estilistas.estado, 'activa'))
	});
	if (!estilista) error(404, 'Página no encontrada');
	const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, estilista.tierId) });
	if (!tier?.tieneAgente) error(403, 'Este negocio no tiene chat en línea');
	return estilista;
}

// Enviar un mensaje al agente. (Turnstile se validará aquí en la fase 2b.)
export const POST: RequestHandler = async (event) => {
	const estilista = await estilistaConAgente(event);
	const body = (await event.request.json().catch(() => null)) as {
		sesion?: string;
		texto?: string;
	} | null;
	const sesion = String(body?.sesion ?? '');
	const texto = String(body?.texto ?? '').trim();
	if (!sesion || !texto) error(400, 'Faltan datos');

	const res = await llamarApi(event.platform!.env, '/publico/chat', {
		estilistaId: estilista.id,
		sesion,
		texto
	});
	if (!res.ok) error(502, 'No pudimos contactar al asistente');
	return json(await res.json());
};

// Historial de la conversación de esta sesión (para reconstruir el chat al recargar).
export const GET: RequestHandler = async (event) => {
	const estilista = await estilistaConAgente(event);
	const sesion = event.url.searchParams.get('sesion');
	if (!sesion) return json({ mensajes: [] });
	const res = await llamarApi(event.platform!.env, '/publico/historial', {
		estilistaId: estilista.id,
		sesion
	});
	return json(res.ok ? await res.json() : { mensajes: [] });
};
