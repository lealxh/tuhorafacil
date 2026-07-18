import { llamarApi } from '$lib/server/api';
import { getDb, getEstilista } from '$lib/server/db';
import { guardarHorariosDesdeForm } from '$lib/server/horarios';
import { crearServicio, eliminarServicio } from '$lib/server/servicios';
import { asc, eq, estilistas, horarios, like, servicios, tiers } from '@tuhorafacil/db';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function generarSlugBase(nombre: string): string {
	return nombre
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, 30);
}

// Plan pagado elegido en la landing antes de crear la cuenta; se hila por el wizard
// vía query param y, al terminar, lleva al checkout mockeado de ese plan.
function planPedido(url: URL): 'recepcionista' | 'pro' | null {
	const valor = url.searchParams.get('plan');
	return valor === 'recepcionista' || valor === 'pro' ? valor : null;
}

export const load: PageServerLoad = async (event) => {
	const { estilista } = await event.parent();
	const pasoPedido = Number(event.url.searchParams.get('paso') ?? '1');
	const paso = estilista ? Math.min(Math.max(pasoPedido, 1), 4) : 1;
	const plan = planPedido(event.url);

	if (!estilista) return { paso: 1, plan, servicios: [], horarios: [], waConectado: false, waError: false };

	// Al volver del setup link de Kapso (?wa=ok) se confirma contra su API:
	// respaldo del webhook phone_number.created por si el evento se pierde
	let waConectado = estilista.waEstado === 'activo';
	if (!waConectado && paso === 4 && event.url.searchParams.get('wa') === 'ok') {
		const res = await llamarApi(event.platform!.env, '/kapso/confirmar', { estilistaId: estilista.id });
		if (res.ok) waConectado = ((await res.json()) as { conectado: boolean }).conectado;
	}

	const db = getDb(event);
	return {
		paso,
		plan,
		waConectado,
		waError: event.url.searchParams.get('wa') === 'error',
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

async function estilistaRequerida(event: Parameters<NonNullable<Actions[string]>>[0]) {
	const est = await getEstilista(getDb(event), event.locals.user!.id);
	if (!est) error(400, 'Primero completa los datos del negocio');
	return est;
}

export const actions: Actions = {
	negocio: async (event) => {
		const datos = await event.request.formData();
		const nombreNegocio = String(datos.get('nombreNegocio') ?? '').trim();
		const rubro = String(datos.get('rubro') ?? '').trim();
		const comuna = String(datos.get('comuna') ?? '').trim();
		const plan = String(datos.get('plan') ?? '');
		const sufijoPlan = plan === 'recepcionista' || plan === 'pro' ? `&plan=${plan}` : '';
		if (!nombreNegocio) return fail(400, { error: 'Ponle nombre a tu negocio.' });

		const db = getDb(event);
		if (await getEstilista(db, event.locals.user!.id))
			redirect(303, `/app/onboarding?paso=2${sufijoPlan}`);

		const tierAgenda = await db.query.tiers.findFirst({ where: eq(tiers.nombre, 'agenda') });
		if (!tierAgenda) error(500, 'Tiers no inicializados');

		const base = generarSlugBase(nombreNegocio) || 'minegocio';
		const existentes = new Set(
			(
				await db
					.select({ slug: estilistas.slugPublico })
					.from(estilistas)
					.where(like(estilistas.slugPublico, `${base}%`))
			).map((r) => r.slug)
		);
		let slug = base;
		for (let n = 2; existentes.has(slug); n++) slug = `${base}${n}`;

		await db.insert(estilistas).values({
			userId: event.locals.user!.id,
			nombre: event.locals.user!.name,
			tierId: tierAgenda.id,
			slugPublico: slug,
			nombreNegocio,
			rubro: rubro || null,
			comuna: comuna || null
		});
		redirect(303, `/app/onboarding?paso=2${sufijoPlan}`);
	},

	agregarServicio: async (event) => {
		const est = await estilistaRequerida(event);
		const resultado = await crearServicio(getDb(event), est.id, await event.request.formData());
		if (resultado) return fail(400, resultado);
	},

	eliminarServicio: async (event) => {
		const est = await estilistaRequerida(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		await eliminarServicio(getDb(event), est.id, id);
	},

	// Genera el setup link de Kapso y manda a la estilista al flujo hosted de conexión
	conectarWa: async (event) => {
		const est = await estilistaRequerida(event);
		const datos = await event.request.formData();
		const plan = String(datos.get('plan') ?? '');
		const sufijoPlan = plan === 'recepcionista' || plan === 'pro' ? `&plan=${plan}` : '';
		const origen = event.url.origin;
		const res = await llamarApi(event.platform!.env, '/kapso/setup-link', {
			estilistaId: est.id,
			successUrl: `${origen}/app/onboarding?paso=4&wa=ok${sufijoPlan}`,
			failureUrl: `${origen}/app/onboarding?paso=4&wa=error${sufijoPlan}`
		});
		if (!res.ok) return fail(502, { error: 'No pudimos generar el link de conexión. Intenta de nuevo.' });
		const { url } = (await res.json()) as { url: string };
		redirect(303, url);
	},

	guardarHorarios: async (event) => {
		const est = await estilistaRequerida(event);
		const datos = await event.request.formData();
		const resultado = await guardarHorariosDesdeForm(getDb(event), est.id, datos);
		if (resultado) return fail(400, resultado);
		const plan = String(datos.get('plan') ?? '');
		const sufijoPlan = plan === 'recepcionista' || plan === 'pro' ? `&plan=${plan}` : '';
		redirect(303, `/app/onboarding?paso=4${sufijoPlan}`);
	}
};
