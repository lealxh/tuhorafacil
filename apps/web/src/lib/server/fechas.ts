const TZ_NEGOCIO = 'America/Santiago';

export function fechaLocalHoy(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TZ_NEGOCIO }).format(new Date());
}
