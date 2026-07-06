import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const objeto = await event.platform!.env.FOTOS.get(event.params.key);
	if (!objeto) error(404, 'No encontrada');

	return new Response(objeto.body, {
		headers: {
			'Content-Type': objeto.httpMetadata?.contentType ?? 'application/octet-stream',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
