import { getDb } from '$lib/server/db';
import {
	CLAVE_RECORDATORIOS_HORA,
	CLAVE_RECORDATORIOS_HORAS_MIN,
	parseConfigRecordatorios,
	RE_HORA_ENVIO
} from '@tuhorafacil/agenda';
import { configuracion } from '@tuhorafacil/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const db = getDb(event);
	const filas = await db.query.configuracion.findMany();
	const valorDe = (clave: string) => filas.find((f) => f.clave === clave)?.valor;
	return {
		config: parseConfigRecordatorios(
			valorDe(CLAVE_RECORDATORIOS_HORA),
			valorDe(CLAVE_RECORDATORIOS_HORAS_MIN)
		)
	};
};

export const actions: Actions = {
	guardar: async (event) => {
		const db = getDb(event);
		const datos = await event.request.formData();
		const horaEnvio = String(datos.get('horaEnvio') ?? '');
		const horasMinimas = Number(datos.get('horasMinimas'));

		if (!RE_HORA_ENVIO.test(horaEnvio)) return fail(400, { error: 'Revisa la hora de envío.' });
		if (!Number.isInteger(horasMinimas) || horasMinimas < 0 || horasMinimas > 12) {
			return fail(400, { error: 'Las horas mínimas deben ser un entero entre 0 y 12.' });
		}

		for (const [clave, valor] of [
			[CLAVE_RECORDATORIOS_HORA, horaEnvio],
			[CLAVE_RECORDATORIOS_HORAS_MIN, String(horasMinimas)]
		]) {
			await db
				.insert(configuracion)
				.values({ clave, valor })
				.onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
		}
		return { guardado: true };
	}
};
