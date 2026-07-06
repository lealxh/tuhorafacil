import { getDb, getEstilista } from '$lib/server/db';
import { guardarHorariosDesdeForm } from '$lib/server/horarios';
import { asc, eq, estilistas, horarios, servicios } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	if (!estilista) redirect(303, '/app/onboarding');
	const db = getDb(event);
	return {
		servicios: await db.query.servicios.findMany({
			where: eq(servicios.estilistaId, estilista.id),
			orderBy: asc(servicios.nombre)
		}),
		horarios: await db.query.horarios.findMany({
			where: eq(horarios.estilistaId, estilista.id),
			orderBy: asc(horarios.diaSemana)
		})
	};
};

export const actions: Actions = {
	negocio: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');

		const datos = await event.request.formData();
		const nombreNegocio = String(datos.get('nombreNegocio') ?? '').trim();
		if (!nombreNegocio) return fail(400, { error: 'El nombre del negocio no puede quedar vacío.' });
		await db
			.update(estilistas)
			.set({
				nombreNegocio,
				rubro: String(datos.get('rubro') ?? '').trim() || null,
				comuna: String(datos.get('comuna') ?? '').trim() || null,
				bio: String(datos.get('bio') ?? '').trim().slice(0, 300) || null
			})
			.where(eq(estilistas.id, estilista.id));
		return { guardado: true };
	},

	horarios: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');
		const resultado = await guardarHorariosDesdeForm(db, estilista.id, await event.request.formData());
		if (resultado) return fail(400, resultado);
		return { guardado: true };
	}
};
