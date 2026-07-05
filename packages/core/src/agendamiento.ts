/**
 * Motor de agendamiento: lógica pura y determinística.
 * El LLM y la UI nunca calculan disponibilidad — solo llaman estas funciones.
 *
 * Convenciones: fechas como 'YYYY-MM-DD' y horas como 'HH:MM', ambas en la
 * hora local del negocio. El caller resuelve zona horaria y filtra por fecha
 * (citas activas de ese día, bloqueos ya recortados al día consultado).
 */

export interface RangoHorario {
  horaInicio: string;
  horaFin: string;
}

export interface HorarioSemanal extends RangoHorario {
  diaSemana: number; // 0 = domingo … 6 = sábado
}

export interface ParamsSlots {
  fecha: string;
  duracionMin: number;
  horarios: HorarioSemanal[];
  /** Citas activas de esa fecha (excluir canceladas) */
  citas: RangoHorario[];
  /** Bloqueos ya recortados a esa fecha */
  bloqueos: RangoHorario[];
  /** Momento actual, para anticipación mínima. Si se omite no se aplica. */
  ahora?: { fecha: string; hora: string };
  /** Minutos mínimos entre ahora y el inicio del slot */
  anticipacionMin?: number;
  /** Separación entre inicios de slot ofrecidos */
  intervaloMin?: number;
}

const INTERVALO_DEFAULT = 15;

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function diaSemanaDe(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function diasEntre(desde: string, hasta: string): number {
  const [ay, am, ad] = desde.split('-').map(Number);
  const [by, bm, bd] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export function seSolapan(a: RangoHorario, b: RangoHorario): boolean {
  return aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin);
}

export function finDeCita(horaInicio: string, duracionMin: number): string {
  return aHora(aMinutos(horaInicio) + duracionMin);
}

/**
 * Slots de inicio disponibles para una fecha, como horas 'HH:MM' ordenadas.
 */
export function slotsDisponibles(params: ParamsSlots): string[] {
  const {
    fecha,
    duracionMin,
    horarios,
    citas,
    bloqueos,
    ahora,
    anticipacionMin = 0,
    intervaloMin = INTERVALO_DEFAULT,
  } = params;

  const dia = diaSemanaDe(fecha);
  const ventanas = horarios.filter((h) => h.diaSemana === dia);
  if (ventanas.length === 0) return [];

  const ocupado = [...citas, ...bloqueos];

  let minimoInicio = -Infinity;
  if (ahora) {
    if (fecha < ahora.fecha) return [];
    // La anticipación cruza medianoche: se expresa relativa a la fecha consultada
    minimoInicio = aMinutos(ahora.hora) + anticipacionMin - diasEntre(ahora.fecha, fecha) * 1440;
  }

  const slots: string[] = [];
  for (const ventana of ventanas) {
    const abre = aMinutos(ventana.horaInicio);
    const cierra = aMinutos(ventana.horaFin);
    for (let inicio = abre; inicio + duracionMin <= cierra; inicio += intervaloMin) {
      if (inicio < minimoInicio) continue;
      const slot = { horaInicio: aHora(inicio), horaFin: aHora(inicio + duracionMin) };
      if (ocupado.some((o) => seSolapan(slot, o))) continue;
      slots.push(slot.horaInicio);
    }
  }
  return [...new Set(slots)].sort();
}

export type MotivoRechazo =
  | 'fuera_de_horario'
  | 'solapa_cita'
  | 'solapa_bloqueo'
  | 'anticipacion_insuficiente'
  | 'en_el_pasado';

/**
 * Valida una cita puntual (creación manual, del agente o de la web pública).
 * Devuelve null si es válida, o el motivo de rechazo.
 */
export function validarCita(params: ParamsSlots & { horaInicio: string }): MotivoRechazo | null {
  const { fecha, horaInicio, duracionMin, horarios, citas, bloqueos, ahora, anticipacionMin = 0 } = params;
  const cita = { horaInicio, horaFin: finDeCita(horaInicio, duracionMin) };

  if (ahora) {
    // Minutos del inicio de la cita relativos a la medianoche del día de "ahora"
    const inicioRelativo = aMinutos(horaInicio) + diasEntre(ahora.fecha, fecha) * 1440;
    const ahoraMin = aMinutos(ahora.hora);
    if (inicioRelativo <= ahoraMin) return 'en_el_pasado';
    if (inicioRelativo < ahoraMin + anticipacionMin) return 'anticipacion_insuficiente';
  }

  const dia = diaSemanaDe(fecha);
  const dentroDeVentana = horarios.some(
    (h) =>
      h.diaSemana === dia &&
      aMinutos(horaInicio) >= aMinutos(h.horaInicio) &&
      aMinutos(cita.horaFin) <= aMinutos(h.horaFin),
  );
  if (!dentroDeVentana) return 'fuera_de_horario';

  if (citas.some((c) => seSolapan(cita, c))) return 'solapa_cita';
  if (bloqueos.some((b) => seSolapan(cita, b))) return 'solapa_bloqueo';
  return null;
}

/**
 * Recorta un bloqueo con timestamps a los rangos horarios que ocupa en una
 * fecha dada, en la zona horaria del negocio. Devuelve [] si no la toca.
 */
export function bloqueoEnFecha(
  bloqueo: { fechaInicio: Date; fechaFin: Date },
  fecha: string,
  timeZone: string,
): RangoHorario[] {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const local = (d: Date) => {
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    return { fecha: `${parts.year}-${parts.month}-${parts.day}`, hora: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` };
  };
  const inicio = local(bloqueo.fechaInicio);
  const fin = local(bloqueo.fechaFin);

  if (fecha < inicio.fecha || fecha > fin.fecha) return [];
  return [
    {
      horaInicio: inicio.fecha === fecha ? inicio.hora : '00:00',
      horaFin: fin.fecha === fecha ? fin.hora : '24:00',
    },
  ];
}
