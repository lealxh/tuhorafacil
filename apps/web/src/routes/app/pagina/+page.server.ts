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
				bio:
					String(datos.get('bio') ?? '')
						.trim()
						.slice(0, 300) || null
			})
			.where(eq(estilistas.id, estilista.id));
		return { guardado: true };
	},

	foto: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');

		const archivo = (await event.request.formData()).get('foto');
		if (!(archivo instanceof File) || archivo.size === 0)
			return fail(400, { error: 'Elige una imagen.' });
		if (archivo.size > MAX_FOTO_BYTES)
			return fail(400, { error: 'La imagen no puede superar 3 MB.' });
		const ext = EXT_POR_TIPO[archivo.type];
		if (!ext) return fail(400, { error: 'Formato no válido: usa JPG, PNG o WebP.' });

		const bucket = event.platform!.env.FOTOS;
		const key = `estilistas/${estilista.id}/${crypto.randomUUID()}.${ext}`;
		// R2.put necesita un cuerpo con largo conocido; File.stream() no lo tiene
		await bucket.put(key, await archivo.arrayBuffer(), {
			httpMetadata: { contentType: archivo.type }
		});

		// Borrar la foto anterior para no dejar huérfanos en R2
		const keyAnterior = estilista.fotoUrl?.replace(/^\/fotos\//, '');
		if (keyAnterior) await bucket.delete(keyAnterior);

		await db
			.update(estilistas)
			.set({ fotoUrl: `/fotos/${key}` })
			.where(eq(estilistas.id, estilista.id));
		return { fotoGuardada: true };
	},

	horarios: async (event) => {
		const db = getDb(event);
		const estilista = await getEstilista(db, event.locals.user!.id);
		if (!estilista) error(400, 'Sin negocio configurado');
		const resultado = await guardarHorariosDesdeForm(
			db,
			estilista.id,
			await event.request.formData()
		);
		if (resultado) return fail(400, resultado);
		return { guardado: true };
	}
};

const MAX_FOTO_BYTES = 3 * 1024 * 1024;
const EXT_POR_TIPO: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};
