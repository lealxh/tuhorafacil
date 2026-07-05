import { getDb, getEstilista } from '$lib/server/db';
import { guardarHorariosDesdeForm } from '$lib/server/horarios';
import { asc, eq, horarios } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	return {
		horarios: await getDb(event).query.horarios.findMany({
			where: eq(horarios.estilistaId, estilista.id),
			orderBy: asc(horarios.diaSemana)
		})
	};
};

export const actions: Actions = {
	guardar: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');
		const resultado = await guardarHorariosDesdeForm(db, estilista.id, await event.request.formData());
		if (resultado) return fail(400, resultado);
		return { guardado: true };
	}
};
