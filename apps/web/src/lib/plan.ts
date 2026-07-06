// Tipo de cambio de referencia del plan de negocio (1 USD = 950 CLP)
export const CLP_POR_USD = 950;

export const montoClp = (precioUsd: number) => Math.round(precioUsd * CLP_POR_USD);
export const clp = (precioUsd: number) => '$' + montoClp(precioUsd).toLocaleString('es-CL');

export const NOMBRES: Record<string, string> = {
	agenda: 'Agenda',
	recepcionista: 'Recepcionista',
	pro: 'Pro'
};

export const DESCRIPCIONES: Record<string, string> = {
	agenda: 'Calendario + link de reserva',
	recepcionista: '+ agente en WhatsApp',
	pro: '+ recordatorios + campañas'
};
