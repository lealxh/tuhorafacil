import { getAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/app');
};

export const actions: Actions = {
	default: async (event) => {
		const datos = await event.request.formData();
		const email = String(datos.get('email') ?? '').trim();
		const password = String(datos.get('password') ?? '');
		if (!email || !password) {
			return fail(400, { error: 'Ingresa tu email y contraseña.', email });
		}

		const auth = getAuth(event.platform!.env);
		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(401, { error: 'Email o contraseña incorrectos.', email });
			}
			throw e;
		}
		redirect(303, '/app');
	}
};
