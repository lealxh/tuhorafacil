import { afterEach, describe, expect, it, vi } from 'vitest';
import { enviarTexto } from './enviar';

afterEach(() => vi.unstubAllGlobals());

function stubFetch() {
	const llamadas: { url: string; init: RequestInit }[] = [];
	vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
		llamadas.push({ url, init });
		return new Response('{}', { status: 200 });
	});
	return llamadas;
}

describe('enviarTexto', () => {
	it('con API key de Kapso envía por Kapso con X-API-Key y body formato Meta', async () => {
		const llamadas = stubFetch();
		await enviarTexto({ kapsoApiKey: 'kapso-key', waAccessToken: 'meta-token' }, 'PNID', '+56911112222', 'hola');

		expect(llamadas).toHaveLength(1);
		expect(llamadas[0].url).toBe('https://api.kapso.ai/meta/whatsapp/v24.0/PNID/messages');
		expect((llamadas[0].init.headers as Record<string, string>)['X-API-Key']).toBe('kapso-key');
		expect(JSON.parse(llamadas[0].init.body as string)).toEqual({
			messaging_product: 'whatsapp',
			to: '+56911112222',
			type: 'text',
			text: { body: 'hola' }
		});
	});

	it('sin Kapso cae a Meta Graph con Bearer', async () => {
		const llamadas = stubFetch();
		await enviarTexto({ waAccessToken: 'meta-token' }, 'PNID', '+56911112222', 'hola');

		expect(llamadas[0].url).toContain('graph.facebook.com');
		expect((llamadas[0].init.headers as Record<string, string>)['Authorization']).toBe('Bearer meta-token');
	});

	it('sin credenciales no llama a nadie (log simulado)', async () => {
		const llamadas = stubFetch();
		await enviarTexto({}, 'PNID', '+56911112222', 'hola');
		expect(llamadas).toHaveLength(0);
	});
});
