import { aMinutos } from '@tuhorafacil/core';

/**
 * Reglas de envío de recordatorios (citas de HOY):
 * - Batch matinal: a partir de `horaEnvio`, todas las citas del día que ya
 *   existían a esa hora reciben su recordatorio.
 * - Rezagadas (agendadas después del batch): reciben el suyo en el siguiente
 *   ciclo, solo si faltan al menos `horasMinimas` para la cita.
 * Editable por admin en la tabla `configuracion` (claves de abajo).
 */
export interface ConfigRecordatorios {
	horaEnvio: string; // HH:MM hora local del negocio
	horasMinimas: number;
}

export const CONFIG_RECORDATORIOS_DEFAULT: ConfigRecordatorios = {
	horaEnvio: '08:00',
	horasMinimas: 2
};

export const CLAVE_RECORDATORIOS_HORA = 'recordatorios_hora_envio';
export const CLAVE_RECORDATORIOS_HORAS_MIN = 'recordatorios_horas_minimas';

export const RE_HORA_ENVIO = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Config desde los valores crudos de `configuracion`; inválidos o ausentes caen al default. */
export function parseConfigRecordatorios(
	hora: string | null | undefined,
	horasMin: string | null | undefined
): ConfigRecordatorios {
	const horasMinNum = Number(horasMin);
	return {
		horaEnvio: hora && RE_HORA_ENVIO.test(hora) ? hora : CONFIG_RECORDATORIOS_DEFAULT.horaEnvio,
		horasMinimas:
			horasMin != null && Number.isInteger(horasMinNum) && horasMinNum >= 0
				? horasMinNum
				: CONFIG_RECORDATORIOS_DEFAULT.horasMinimas
	};
}

/** Decide si corresponde generar YA el recordatorio de una cita de hoy. */
export function correspondeRecordatorio(
	cita: { horaInicio: string; creadaAntesDelEnvio: boolean },
	ahora: string, // HH:MM hora local
	config: ConfigRecordatorios
): boolean {
	if (aMinutos(ahora) < aMinutos(config.horaEnvio)) return false;
	if (aMinutos(cita.horaInicio) <= aMinutos(ahora)) return false; // la cita ya pasó
	if (cita.creadaAntesDelEnvio) return true; // batch matinal (aunque falte poco)
	return aMinutos(cita.horaInicio) >= aMinutos(ahora) + config.horasMinimas * 60;
}
