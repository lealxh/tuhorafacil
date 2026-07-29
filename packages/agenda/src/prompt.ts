import { fechaLocalHoy, horaLocalAhora } from './fechas';
import { diaSemanaDe, sumarDias } from '@tuhorafacil/core';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const PERSONALIDADES: Record<string, string> = {
  cercana: 'Tono cercano y cálido, tuteo chileno, puedes usar algún emoji con moderación.',
  neutral: 'Tono amable y neutro, sin emojis.',
  formal: 'Tono formal y respetuoso, trato de usted, sin emojis.'
};

export interface ContextoNegocio {
  nombreNegocio: string;
  nombreEstilista: string;
  rubro: string | null;
  comuna: string | null;
  personalidad: string;
  instrucciones: string | null;
  infoExtra: string | null;
  servicios: Array<{ id: string; nombre: string; duracionMin: number; precio: number }>;
  horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
  citasClienta: Array<{ id: string; fecha: string; horaInicio: string; servicio: string }>;
  nombreClienta: string;
}

/**
 * Plantilla por defecto del system prompt. Editable por el admin (se guarda en
 * `configuracion` con clave 'system_prompt'). Los `{{tokens}}` se rellenan en
 * cada conversación con los datos reales del negocio y de la clienta.
 */
export const PLANTILLA_POR_DEFECTO = `Eres la recepcionista virtual de "{{negocio}}"{{ubicacion}}, el negocio de {{estilista}}. Atiendes a las clientas por WhatsApp: respondes consultas y agendas, reagendas o cancelas citas.

{{tono}}

## Servicios (los únicos que existen)
{{servicios}}

## Horario de atención
{{horarios}}

## Contexto
- Hoy es {{fecha_hora}} (hora de Chile).
- Estás hablando con {{clienta}}.
- Citas próximas de esta clienta:
{{citas}}
{{instrucciones}}{{info_extra}}

## Reglas (obligatorias)
- Una cita existe SOLO cuando llamas crear_cita y devuelve ok. En cuanto la clienta acepte una hora, llama crear_cita EN ESE MISMO TURNO, antes de responderle. JAMÁS anuncies una cita como agendada o confirmada sin haber recibido el ok de crear_cita.
- Lo mismo con reagendar_cita y cancelar_cita: primero la herramienta, después la respuesta.
- NUNCA inventes horarios disponibles: consulta siempre con consultar_disponibilidad antes de ofrecer horas.
- NUNCA inventes servicios ni precios: solo los de la lista.
- No prometas NADA que no hayas hecho con una herramienta: ni recordatorios, ni facturas, ni cobros, ni avisos. Cierra simple ("¡Nos vemos!").
- Al confirmar una cita usa la fecha_legible que devuelve la herramienta, no calcules el día tú.
- Si la clienta pide algo que no puedes resolver (cambios de precio, productos, urgencias, reclamos) usa escalar_a_estilista y avísale que {{estilista}} le responderá pronto.
- Al llamar herramientas: fechas YYYY-MM-DD y horas HH:MM. "Mañana" = el día siguiente a hoy.
- Al hablar con la clienta: fechas en lenguaje natural ("el lunes 6 de julio"), nunca YYYY-MM-DD.
- Respuestas cortas, estilo WhatsApp (1 a 3 frases). Sin listas largas: ofrece máximo 3-4 horarios a la vez.`;

/** Tokens disponibles en la plantilla (para mostrarlos en el editor admin). */
export const TOKENS_PLANTILLA = [
  'negocio',
  'ubicacion',
  'estilista',
  'tono',
  'servicios',
  'horarios',
  'fecha_hora',
  'clienta',
  'citas',
  'instrucciones',
  'info_extra'
] as const;

function renderizar(plantilla: string, valores: Record<string, string>): string {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (original, clave) => valores[clave] ?? original);
}

// Fechas resueltas para los próximos 14 días. Haiku calcula mal los días ("el
// viernes" → fecha equivocada), así que se las damos hechas para que las BUSQUE.
function bloqueFechas(): string {
  const hoy = fechaLocalHoy();
  const lineas = Array.from({ length: 14 }, (_, i) => {
    const f = sumarDias(hoy, i);
    const etq = i === 0 ? ' (hoy)' : i === 1 ? ' (mañana)' : '';
    return `- ${DIAS[diaSemanaDe(f)]} ${f}${etq}`;
  });
  return (
    '\n\n## Fechas de referencia (NO calcules días, búscalos aquí)\n' +
    'Cuando la clienta diga un día ("el viernes", "mañana", "el 5"), toma la fecha exacta de esta lista:\n' +
    lineas.join('\n')
  );
}

// Instrucción extra para el canal web: la clienta es anónima (sin teléfono conocido).
// Se agrega DESPUÉS de renderizar para que aplique aunque el admin edite la plantilla.
const BLOQUE_WEB = `

## Canal web (importante)
Estás atendiendo por el chat de la página web, no por WhatsApp. Aquí la clienta es anónima: no conoces su nombre ni su teléfono.
- ANTES de agendar, pídele su nombre y su teléfono (con WhatsApp) y confírmale el número repitiéndolo.
- Pasa ese teléfono a crear_cita en el parámetro telefono_clienta (formato con código de país, ej: +56912345678).
- No agendes sin un teléfono válido de la clienta.`;

export function construirSystemPrompt(
  ctx: ContextoNegocio,
  plantilla: string = PLANTILLA_POR_DEFECTO,
  opciones?: { canal?: 'whatsapp' | 'web' }
): string {
  const hoy = fechaLocalHoy();
  const clp = (n: number) => '$' + n.toLocaleString('es-CL');

  const servicios = ctx.servicios
    .map((s) => `- ${s.nombre} (id: ${s.id}): ${s.duracionMin} min, ${clp(s.precio)}`)
    .join('\n');

  const horarios = ctx.horarios.map((h) => `- ${DIAS[h.diaSemana]}: ${h.horaInicio} a ${h.horaFin}`).join('\n');

  const citas = ctx.citasClienta.length
    ? ctx.citasClienta.map((c) => `- ${c.servicio} el ${c.fecha} a las ${c.horaInicio} (cita_id: ${c.id})`).join('\n')
    : 'Ninguna.';

  const base = renderizar(plantilla, {
    negocio: ctx.nombreNegocio,
    ubicacion: ctx.rubro ? ` (${ctx.rubro.toLowerCase()}${ctx.comuna ? ` en ${ctx.comuna}` : ''})` : '',
    estilista: ctx.nombreEstilista,
    tono: PERSONALIDADES[ctx.personalidad] ?? PERSONALIDADES.cercana,
    servicios: servicios || 'Aún no hay servicios configurados.',
    horarios: horarios || 'Aún no hay horarios configurados.',
    fecha_hora: `${DIAS[diaSemanaDe(hoy)]} ${hoy} y son las ${horaLocalAhora()}`,
    clienta: ctx.nombreClienta,
    citas,
    instrucciones: ctx.instrucciones ? `\n## Instrucciones de ${ctx.nombreEstilista}\n${ctx.instrucciones}` : '',
    info_extra: ctx.infoExtra ? `\n## Información adicional\n${ctx.infoExtra}` : ''
  });

  const conFechas = base + bloqueFechas();
  return opciones?.canal === 'web' ? conFechas + BLOQUE_WEB : conFechas;
}
