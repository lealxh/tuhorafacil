import { getDb } from '$lib/server/db';
import { PLANTILLA_POR_DEFECTO, TOKENS_PLANTILLA } from '@tuhorafacil/agenda';
import { configuracion, eq } from '@tuhorafacil/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const CLAVE = 'system_prompt';

export const load: PageServerLoad = async (event) => {
	const db = getDb(event);
	const fila = await db.query.configuracion.findFirst({ where: eq(configuracion.clave, CLAVE) });
	return {
		plantilla: fila?.valor ?? PLANTILLA_POR_DEFECTO,
		personalizado: !!fila,
		porDefecto: PLANTILLA_POR_DEFECTO,
		tokens: TOKENS_PLANTILLA
	};
};

export const actions: Actions = {
	guardar: async (event) => {
		const db = getDb(event);
		const valor = String((await event.request.formData()).get('plantilla') ?? '').trim();
		if (!valor) return fail(400, { error: 'El prompt no puede quedar vacío.' });
		await db
			.insert(configuracion)
			.values({ clave: CLAVE, valor })
			.onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
		return { guardado: true };
	},

	// Vuelve al prompt por defecto (borra el override; el agente usa la plantilla del código)
	restaurar: async (event) => {
		const db = getDb(event);
		await db.delete(configuracion).where(eq(configuracion.clave, CLAVE));
		return { restaurado: true };
	}
};
