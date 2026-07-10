import { describe, expect, it } from 'vitest';
import { instanteLocal } from './citas';
import { TZ_NEGOCIO } from './fechas';

/** Formatea un instante de vuelta a fecha/hora locales de Chile, para verificar el roundtrip. */
function enChile(d: Date): { fecha: string; hora: string } {
	const fmt = new Intl.DateTimeFormat('en-CA', {
		timeZone: TZ_NEGOCIO,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
	return {
		fecha: `${p.year}-${p.month}-${p.day}`,
		hora: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`
	};
}

describe('instanteLocal', () => {
	it('convierte una hora de verano chileno (UTC-3)', () => {
		expect(instanteLocal('2026-01-15', '10:00').toISOString()).toBe('2026-01-15T13:00:00.000Z');
	});

	it('convierte una hora de invierno chileno (UTC-4)', () => {
		expect(instanteLocal('2026-06-15', '10:00').toISOString()).toBe('2026-06-15T14:00:00.000Z');
	});

	it('hace roundtrip exacto en fechas alrededor de los cambios de DST', () => {
		const casos = [
			['2026-04-01', '09:30'],
			['2026-04-10', '09:30'],
			['2026-09-01', '18:45'],
			['2026-09-15', '18:45'],
			['2026-12-31', '23:00']
		] as const;
		for (const [fecha, hora] of casos) {
			expect(enChile(instanteLocal(fecha, hora))).toEqual({ fecha, hora });
		}
	});

	it('la medianoche no se desplaza de día', () => {
		expect(enChile(instanteLocal('2026-07-08', '00:00'))).toEqual({
			fecha: '2026-07-08',
			hora: '00:00'
		});
	});
});
