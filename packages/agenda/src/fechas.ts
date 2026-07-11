const TZ_NEGOCIO = 'America/Santiago';

export function fechaLocalHoy(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TZ_NEGOCIO }).format(new Date());
}

export function horaLocalAhora(): string {
	const hora = new Intl.DateTimeFormat('en-GB', {
		timeZone: TZ_NEGOCIO,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(new Date());
	return hora === '24:00' ? '00:00' : hora;
}

/** '2026-07-06' → 'lunes 6 de julio' — para mensajes a clientas y para que el LLM no calcule el día. */
export function fechaLegible(fecha: string): string {
	return new Intl.DateTimeFormat('es-CL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	}).format(new Date(`${fecha}T12:00:00Z`));
}

export { TZ_NEGOCIO };
