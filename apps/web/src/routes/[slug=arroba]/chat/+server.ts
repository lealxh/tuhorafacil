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

const COOKIE_VERIFICADO = 'thf_chat_ok';

// Verifica el token de Turnstile con Cloudflare (anti-bot). Sin secret configurado
// (dev) no exige nada. Devuelve true si está verificado (por token o por cookie previa).
async function pasaTurnstile(event: RequestEvent, token: string): Promise<boolean> {
	const secret = event.platform?.env?.TURNSTILE_SECRET;
	if (!secret) return true; // dev / no configurado: degrada
	if (event.cookies.get(COOKIE_VERIFICADO)) return true; // ya verificado en esta sesión
	if (!token) return false;

	const form = new FormData();
	form.set('secret', secret);
	form.set('response', token);
	const ip = event.request.headers.get('CF-Connecting-IP');
	if (ip) form.set('remoteip', ip);
	const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: form
	});
	const ok = r.ok && ((await r.json()) as { success?: boolean }).success === true;
	if (ok) {
		// Verificado una vez: se confía la sesión un rato para no pedir captcha en cada mensaje
		event.cookies.set(COOKIE_VERIFICADO, '1', {
			path: `/${event.params.slug}`,
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 2
		});
	}
	return ok;
}

// Enviar un mensaje al agente. Verifica Turnstile antes de gastar tokens del modelo.
export const POST: RequestHandler = async (event) => {
	const estilista = await estilistaConAgente(event);
	const body = (await event.request.json().catch(() => null)) as {
		sesion?: string;
		texto?: string;
		turnstileToken?: string;
	} | null;
	const sesion = String(body?.sesion ?? '');
	const texto = String(body?.texto ?? '').trim();
	if (!sesion || !texto) error(400, 'Faltan datos');

	if (!(await pasaTurnstile(event, String(body?.turnstileToken ?? '')))) {
		error(403, 'Verificación anti-bot fallida. Recarga la página e intenta de nuevo.');
	}

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
