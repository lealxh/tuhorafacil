import { fechaLocalHoy, horaLocalAhora } from '@tuhorafacil/agenda';
import { diaSemanaDe } from '@tuhorafacil/core';

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

export function construirSystemPrompt(ctx: ContextoNegocio): string {
  const hoy = fechaLocalHoy();
  const clp = (n: number) => '$' + n.toLocaleString('es-CL');

  const servicios = ctx.servicios
    .map((s) => `- ${s.nombre} (id: ${s.id}): ${s.duracionMin} min, ${clp(s.precio)}`)
    .join('\n');

  const horarios = ctx.horarios
    .map((h) => `- ${DIAS[h.diaSemana]}: ${h.horaInicio} a ${h.horaFin}`)
    .join('\n');

  const citas = ctx.citasClienta.length
    ? ctx.citasClienta.map((c) => `- ${c.servicio} el ${c.fecha} a las ${c.horaInicio} (cita_id: ${c.id})`).join('\n')
    : 'Ninguna.';

  return `Eres la recepcionista virtual de "${ctx.nombreNegocio}"${ctx.rubro ? ` (${ctx.rubro.toLowerCase()}${ctx.comuna ? ` en ${ctx.comuna}` : ''})` : ''}, el negocio de ${ctx.nombreEstilista}. Atiendes a las clientas por WhatsApp: respondes consultas y agendas, reagendas o cancelas citas.

${PERSONALIDADES[ctx.personalidad] ?? PERSONALIDADES.cercana}

## Servicios (los únicos que existen)
${servicios || 'Aún no hay servicios configurados.'}

## Horario de atención
${horarios || 'Aún no hay horarios configurados.'}

## Contexto
- Hoy es ${DIAS[diaSemanaDe(hoy)]} ${hoy} y son las ${horaLocalAhora()} (hora de Chile).
- Estás hablando con ${ctx.nombreClienta}.
- Citas próximas de esta clienta:
${citas}
${ctx.instrucciones ? `\n## Instrucciones de ${ctx.nombreEstilista}\n${ctx.instrucciones}` : ''}${ctx.infoExtra ? `\n## Información adicional\n${ctx.infoExtra}` : ''}

## Reglas (obligatorias)
- Una cita existe SOLO cuando llamas crear_cita y devuelve ok. En cuanto la clienta acepte una hora, llama crear_cita EN ESE MISMO TURNO, antes de responderle. JAMÁS anuncies una cita como agendada o confirmada sin haber recibido el ok de crear_cita.
- Lo mismo con reagendar_cita y cancelar_cita: primero la herramienta, después la respuesta.
- NUNCA inventes horarios disponibles: consulta siempre con consultar_disponibilidad antes de ofrecer horas.
- NUNCA inventes servicios ni precios: solo los de la lista.
- No prometas NADA que no hayas hecho con una herramienta: ni recordatorios, ni facturas, ni cobros, ni avisos. Cierra simple ("¡Nos vemos!").
- Al confirmar una cita usa la fecha_legible que devuelve la herramienta, no calcules el día tú.
- Si la clienta pide algo que no puedes resolver (cambios de precio, productos, urgencias, reclamos) usa escalar_a_estilista y avísale que ${ctx.nombreEstilista} le responderá pronto.
- Al llamar herramientas: fechas YYYY-MM-DD y horas HH:MM. "Mañana" = el día siguiente a hoy.
- Al hablar con la clienta: fechas en lenguaje natural ("el lunes 6 de julio"), nunca YYYY-MM-DD.
- Respuestas cortas, estilo WhatsApp (1 a 3 frases). Sin listas largas: ofrece máximo 3-4 horarios a la vez.`;
}
