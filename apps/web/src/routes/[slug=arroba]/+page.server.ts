import { getDb } from '$lib/server/db';
import { and, asc, eq, estilistas, horarios, servicios } from '@tuhorafacil/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const slug = event.params.slug.slice(1); // sin el @
	const db = getDb(event);

	const estilista = await db.query.estilistas.findFirst({
		where: and(eq(estilistas.slugPublico, slug), eq(estilistas.estado, 'activa'))
	});
	if (!estilista) error(404, 'Página no encontrada');

	return {
		negocio: {
			nombre: estilista.nombreNegocio,
			rubro: estilista.rubro,
			comuna: estilista.comuna,
			bio: estilista.bio
		},
		servicios: await db.query.servicios.findMany({
			where: and(eq(servicios.estilistaId, estilista.id), eq(servicios.activo, true)),
			orderBy: asc(servicios.nombre)
		}),
		horarios: await db.query.horarios.findMany({
			where: eq(horarios.estilistaId, estilista.id),
			orderBy: asc(horarios.diaSemana)
		})
	};
};
