import { getAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	perfil: async (event) => {
		const nombre = String((await event.request.formData()).get('nombre') ?? '').trim();
		if (!nombre) return fail(400, { seccion: 'perfil', error: 'Tu nombre no puede quedar vacío.' });
		const auth = getAuth(event.platform!.env);
		await auth.api.updateUser({ body: { name: nombre }, headers: event.request.headers });
		return { seccion: 'perfil', guardado: true };
	},

	password: async (event) => {
		const datos = await event.request.formData();
		const actual = String(datos.get('actual') ?? '');
		const nueva = String(datos.get('nueva') ?? '');
		if (nueva.length < 8) {
			return fail(400, { seccion: 'password', error: 'La contraseña nueva debe tener al menos 8 caracteres.' });
		}
		const auth = getAuth(event.platform!.env);
		try {
			await auth.api.changePassword({
				body: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: true },
				headers: event.request.headers
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { seccion: 'password', error: 'La contraseña actual no es correcta.' });
			}
			throw e;
		}
		return { seccion: 'password', guardado: true };
	},

	logout: async (event) => {
		const auth = getAuth(event.platform!.env);
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/login');
	}
};
