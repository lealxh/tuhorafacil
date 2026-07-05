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
		const nombre = String(datos.get('nombre') ?? '').trim();
		const email = String(datos.get('email') ?? '').trim();
		const password = String(datos.get('password') ?? '');

		if (!nombre || !email || !password) {
			return fail(400, { error: 'Completa todos los campos.', nombre, email });
		}
		if (password.length < 8) {
			return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres.', nombre, email });
		}

		const auth = getAuth(event.platform!.env);
		try {
			await auth.api.signUpEmail({
				body: { name: nombre, email, password },
				headers: event.request.headers
			});
		} catch (e) {
			if (e instanceof APIError) {
				const yaExiste = e.status === 'UNPROCESSABLE_ENTITY';
				return fail(400, {
					error: yaExiste ? 'Ya existe una cuenta con ese email.' : 'No pudimos crear tu cuenta. Revisa los datos.',
					nombre,
					email
				});
			}
			throw e;
		}
		redirect(303, '/app');
	}
};
