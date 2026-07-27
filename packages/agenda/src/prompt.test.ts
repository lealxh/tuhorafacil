import { describe, expect, it } from 'vitest';
import { construirSystemPrompt, type ContextoNegocio } from './prompt';

const ctx: ContextoNegocio = {
	nombreNegocio: 'Salón Test',
	nombreEstilista: 'Ana',
	rubro: 'Peluquería',
	comuna: 'Santiago',
	personalidad: 'cercana',
	instrucciones: null,
	infoExtra: null,
	servicios: [{ id: 's1', nombre: 'Corte', duracionMin: 30, precio: 10000 }],
	horarios: [{ diaSemana: 1, horaInicio: '10:00', horaFin: '19:00' }],
	citasClienta: [],
	nombreClienta: 'Clienta'
};

describe('construirSystemPrompt canal', () => {
	it('WhatsApp (default) no incluye el bloque web', () => {
		const p = construirSystemPrompt(ctx);
		expect(p).not.toContain('Canal web');
		expect(p).toContain('Salón Test');
	});

	it('canal web agrega la instrucción de pedir nombre y teléfono', () => {
		const p = construirSystemPrompt(ctx, undefined, { canal: 'web' });
		expect(p).toContain('Canal web');
		expect(p).toContain('telefono_clienta');
	});
});
