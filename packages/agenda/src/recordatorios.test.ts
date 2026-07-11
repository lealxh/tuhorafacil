import { describe, expect, it } from 'vitest';
import {
	CONFIG_RECORDATORIOS_DEFAULT,
	correspondeRecordatorio,
	parseConfigRecordatorios
} from './recordatorios';

const config = { horaEnvio: '08:00', horasMinimas: 2 };

describe('correspondeRecordatorio', () => {
	it('no genera nada antes de la hora de envío', () => {
		expect(
			correspondeRecordatorio({ horaInicio: '15:00', creadaAntesDelEnvio: true }, '07:30', config)
		).toBe(false);
	});

	it('batch matinal: recuerda las citas que existían a la hora de envío, aunque falte poco', () => {
		expect(
			correspondeRecordatorio({ horaInicio: '09:00', creadaAntesDelEnvio: true }, '08:00', config)
		).toBe(true);
	});

	it('nunca recuerda citas que ya pasaron', () => {
		expect(
			correspondeRecordatorio({ horaInicio: '10:00', creadaAntesDelEnvio: true }, '11:00', config)
		).toBe(false);
	});

	it('rezagada: espera hasta que falten al menos las horas mínimas', () => {
		const cita = { horaInicio: '15:00', creadaAntesDelEnvio: false };
		expect(correspondeRecordatorio(cita, '12:59', config)).toBe(true);
		expect(correspondeRecordatorio(cita, '13:00', config)).toBe(true); // justo 2h
		expect(correspondeRecordatorio(cita, '13:01', config)).toBe(false); // menos de 2h
	});

	it('con horasMinimas 0, la rezagada se recuerda mientras no haya pasado', () => {
		expect(
			correspondeRecordatorio({ horaInicio: '15:00', creadaAntesDelEnvio: false }, '14:59', {
				...config,
				horasMinimas: 0
			})
		).toBe(true);
	});
});

describe('parseConfigRecordatorios', () => {
	it('usa los valores válidos', () => {
		expect(parseConfigRecordatorios('09:30', '4')).toEqual({ horaEnvio: '09:30', horasMinimas: 4 });
	});

	it('cae al default con valores ausentes o inválidos', () => {
		expect(parseConfigRecordatorios(null, undefined)).toEqual(CONFIG_RECORDATORIOS_DEFAULT);
		expect(parseConfigRecordatorios('25:00', '-1')).toEqual(CONFIG_RECORDATORIOS_DEFAULT);
		expect(parseConfigRecordatorios('8am', '2.5')).toEqual(CONFIG_RECORDATORIOS_DEFAULT);
	});
});
