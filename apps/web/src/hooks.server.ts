import { building } from '$app/environment';
import { getAuth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	const auth = getAuth(event.platform!.env);
	const sesion = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = sesion?.user ?? null;
	event.locals.session = sesion?.session ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};
