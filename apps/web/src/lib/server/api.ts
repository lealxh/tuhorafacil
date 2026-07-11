/**
 * Llama a la api por service binding (en producción Cloudflare bloquea el fetch
 * a workers.dev de la propia cuenta); en dev local cae al fetch normal.
 */
export function llamarApi(env: App.Platform['env'], ruta: string, body: unknown): Promise<Response> {
	const req = new Request(`${env.API_BASE_URL}${ruta}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Mock-Secret': env.MOCK_CHAT_SECRET },
		body: JSON.stringify(body)
	});
	return env.API ? env.API.fetch(req) : fetch(req);
}
