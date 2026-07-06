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

export { TZ_NEGOCIO };
