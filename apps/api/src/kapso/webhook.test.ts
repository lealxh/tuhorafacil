import { describe, expect, it } from 'vitest';
import { eventosDe, mapearEventoKapso, verificarFirmaKapso } from './webhook';

const SECRET = 'secreto-de-prueba';

async function firmar(cuerpo: string): Promise<string> {
	const clave = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const mac = new Uint8Array(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpo)));
	return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('verificarFirmaKapso', () => {
	it('acepta la firma correcta, con y sin prefijo sha256=', async () => {
		const cuerpo = '{"type":"whatsapp.message.received"}';
		const firma = await firmar(cuerpo);
		expect(await verificarFirmaKapso(cuerpo, firma, SECRET)).toBe(true);
		expect(await verificarFirmaKapso(cuerpo, `sha256=${firma}`, SECRET)).toBe(true);
	});

	it('rechaza firma incorrecta, ausente o de otro body', async () => {
		const cuerpo = '{"a":1}';
		expect(await verificarFirmaKapso(cuerpo, await firmar('{"a":2}'), SECRET)).toBe(false);
		expect(await verificarFirmaKapso(cuerpo, null, SECRET)).toBe(false);
		expect(await verificarFirmaKapso(cuerpo, 'abc123', SECRET)).toBe(false);
	});
});

describe('eventosDe', () => {
	it('normaliza data como objeto único o array (batch)', () => {
		const evento = { phone_number_id: '123' };
		expect(eventosDe({ data: evento })).toEqual([evento]);
		expect(eventosDe({ batch: true, data: [evento, evento] })).toHaveLength(2);
		expect(eventosDe({})).toEqual([]);
	});
});

describe('mapearEventoKapso', () => {
	const base = {
		phone_number_id: 'PNID_1',
		message: {
			id: 'wamid.abc',
			type: 'text',
			from: '56911112222',
			text: { body: 'hola' },
			kapso: { direction: 'inbound', origin: 'cloud_api', phone_number: '+56911112222' }
		},
		conversation: { id: 'conv_1', phone_number: '+56911112222', contact_name: 'Vale' }
	};

	it('message.received → entrante normalizado con waId y teléfono con +', () => {
		const r = mapearEventoKapso('whatsapp.message.received', base);
		expect(r).toEqual({
			accion: 'entrante',
			entrada: {
				phoneNumberId: 'PNID_1',
				telefono: '+56911112222',
				nombrePerfil: 'Vale',
				tipo: 'text',
				texto: 'hola',
				waId: 'wamid.abc'
			}
		});
	});

	it('message.received sin contact_name cae a Clienta', () => {
		const r = mapearEventoKapso('whatsapp.message.received', {
			phone_number_id: 'PNID_1',
			message: { id: 'w1', type: 'text', from: '56911112222', text: { body: 'hola' } }
		});
		expect(r.accion).toBe('entrante');
		if (r.accion === 'entrante') expect(r.entrada.nombrePerfil).toBe('Clienta');
	});

	it('message.sent desde el teléfono (business_app) → eco', () => {
		const r = mapearEventoKapso('whatsapp.message.sent', {
			...base,
			message: { ...base.message, kapso: { direction: 'outbound', origin: 'business_app' } }
		});
		expect(r).toEqual({ accion: 'eco', phoneNumberId: 'PNID_1', telefonoClienta: '+56911112222' });
	});

	it('message.sent de nuestra propia API se ignora', () => {
		const r = mapearEventoKapso('whatsapp.message.sent', {
			...base,
			message: { ...base.message, kapso: { direction: 'outbound', origin: 'cloud_api' } }
		});
		expect(r).toEqual({ accion: 'ignorar', motivo: 'envio_propio' });
	});

	it('phone_number.created → numero_conectado con customer id', () => {
		const r = mapearEventoKapso('whatsapp.phone_number.created', {
			phone_number_id: 'PN_NUEVO',
			customer: { id: 'cust-uuid-1' }
		});
		expect(r).toEqual({ accion: 'numero_conectado', phoneNumberId: 'PN_NUEVO', customerId: 'cust-uuid-1' });
	});

	it('phone_number.created sin customer se ignora', () => {
		expect(mapearEventoKapso('whatsapp.phone_number.created', { phone_number_id: 'PN' }).accion).toBe('ignorar');
	});

	it('eventos sin phone_number_id o de otros tipos se ignoran', () => {
		expect(mapearEventoKapso('whatsapp.message.received', {}).accion).toBe('ignorar');
		expect(mapearEventoKapso('whatsapp.message.read', base).accion).toBe('ignorar');
		expect(mapearEventoKapso(undefined, base).accion).toBe('ignorar');
	});
});
