import { describe, expect, it } from 'vitest';
import {
  bloqueoEnFecha,
  diaSemanaDe,
  diasEntre,
  finDeCita,
  seSolapan,
  slotsDisponibles,
  validarCita,
} from './agendamiento';

// Jueves 9 de julio 2026; horario 10:00–19:00 de lunes a viernes
const JUEVES = '2026-07-09';
const horarios = [1, 2, 3, 4, 5].map((diaSemana) => ({
  diaSemana,
  horaInicio: '10:00',
  horaFin: '19:00',
}));

const base = {
  fecha: JUEVES,
  duracionMin: 60,
  horarios,
  citas: [],
  bloqueos: [],
  intervaloMin: 30,
};

describe('helpers', () => {
  it('diaSemanaDe es estable sin importar la zona horaria del runtime', () => {
    expect(diaSemanaDe('2026-07-09')).toBe(4); // jueves
    expect(diaSemanaDe('2026-07-12')).toBe(0); // domingo
  });

  it('diasEntre cuenta días de calendario', () => {
    expect(diasEntre('2026-07-09', '2026-07-10')).toBe(1);
    expect(diasEntre('2026-07-31', '2026-08-01')).toBe(1);
    expect(diasEntre('2026-07-10', '2026-07-09')).toBe(-1);
  });

  it('seSolapan detecta solapamiento pero no adyacencia', () => {
    const a = { horaInicio: '10:00', horaFin: '11:00' };
    expect(seSolapan(a, { horaInicio: '10:30', horaFin: '11:30' })).toBe(true);
    expect(seSolapan(a, { horaInicio: '11:00', horaFin: '12:00' })).toBe(false);
    expect(seSolapan(a, { horaInicio: '09:00', horaFin: '10:00' })).toBe(false);
    expect(seSolapan(a, { horaInicio: '09:00', horaFin: '13:00' })).toBe(true);
  });

  it('finDeCita suma la duración', () => {
    expect(finDeCita('10:45', 90)).toBe('12:15');
  });
});

describe('slotsDisponibles', () => {
  it('día sin horario configurado → sin slots', () => {
    expect(slotsDisponibles({ ...base, fecha: '2026-07-12' })).toEqual([]); // domingo
  });

  it('agenda vacía ofrece toda la ventana y respeta que la cita quepa antes del cierre', () => {
    const slots = slotsDisponibles(base);
    expect(slots[0]).toBe('10:00');
    expect(slots.at(-1)).toBe('18:00'); // 18:00 + 60min = 19:00 (justo al cierre)
    expect(slots).toHaveLength(17);
  });

  it('un servicio largo reduce los inicios posibles', () => {
    const slots = slotsDisponibles({ ...base, duracionMin: 180 });
    expect(slots.at(-1)).toBe('16:00');
  });

  it('las citas existentes bloquean cualquier inicio que se solape', () => {
    const slots = slotsDisponibles({
      ...base,
      citas: [{ horaInicio: '12:00', horaFin: '13:00' }],
    });
    expect(slots).not.toContain('11:30'); // terminaría 12:30, dentro de la cita
    expect(slots).not.toContain('12:00');
    expect(slots).not.toContain('12:30');
    expect(slots).toContain('11:00'); // termina justo cuando empieza la cita
    expect(slots).toContain('13:00'); // empieza justo cuando termina
  });

  it('los bloqueos funcionan igual que las citas', () => {
    const slots = slotsDisponibles({
      ...base,
      bloqueos: [{ horaInicio: '13:00', horaFin: '14:00' }], // almuerzo
    });
    expect(slots).not.toContain('13:30');
    expect(slots).toContain('12:00');
    expect(slots).toContain('14:00');
  });

  it('fecha en el pasado → sin slots', () => {
    expect(
      slotsDisponibles({ ...base, ahora: { fecha: '2026-07-10', hora: '09:00' } }),
    ).toEqual([]);
  });

  it('hoy solo ofrece slots después de ahora + anticipación', () => {
    const slots = slotsDisponibles({
      ...base,
      ahora: { fecha: JUEVES, hora: '14:10' },
      anticipacionMin: 60,
    });
    expect(slots[0]).toBe('15:30'); // primer inicio ≥ 15:10 en pasos de 30
  });

  it('la anticipación cruza medianoche hacia el día siguiente', () => {
    const slots = slotsDisponibles({
      ...base,
      fecha: '2026-07-10', // viernes
      ahora: { fecha: JUEVES, hora: '23:00' },
      anticipacionMin: 12 * 60,
    });
    expect(slots[0]).toBe('11:00'); // 23:00 + 12h = 11:00 del viernes
  });
});

describe('validarCita', () => {
  it('acepta una cita válida', () => {
    expect(validarCita({ ...base, horaInicio: '10:00' })).toBeNull();
  });

  it('rechaza fuera del horario de atención', () => {
    expect(validarCita({ ...base, horaInicio: '09:00' })).toBe('fuera_de_horario');
    expect(validarCita({ ...base, horaInicio: '18:30' })).toBe('fuera_de_horario'); // termina 19:30
    expect(validarCita({ ...base, fecha: '2026-07-12', horaInicio: '11:00' })).toBe('fuera_de_horario');
  });

  it('rechaza solapamiento con cita y con bloqueo', () => {
    const citas = [{ horaInicio: '12:00', horaFin: '13:00' }];
    expect(validarCita({ ...base, citas, horaInicio: '12:30' })).toBe('solapa_cita');
    const bloqueos = [{ horaInicio: '15:00', horaFin: '16:00' }];
    expect(validarCita({ ...base, bloqueos, horaInicio: '15:30' })).toBe('solapa_bloqueo');
  });

  it('acepta citas adyacentes (termina cuando empieza la otra)', () => {
    const citas = [{ horaInicio: '12:00', horaFin: '13:00' }];
    expect(validarCita({ ...base, citas, horaInicio: '11:00' })).toBeNull();
    expect(validarCita({ ...base, citas, horaInicio: '13:00' })).toBeNull();
  });

  it('rechaza pasado y anticipación insuficiente, incluso cruzando medianoche', () => {
    const ahora = { fecha: JUEVES, hora: '14:00' };
    expect(validarCita({ ...base, ahora, horaInicio: '13:00' })).toBe('en_el_pasado');
    expect(validarCita({ ...base, ahora, anticipacionMin: 120, horaInicio: '15:00' })).toBe(
      'anticipacion_insuficiente',
    );
    expect(
      validarCita({
        ...base,
        fecha: '2026-07-10',
        ahora: { fecha: JUEVES, hora: '23:00' },
        anticipacionMin: 12 * 60,
        horaInicio: '10:30',
      }),
    ).toBe('anticipacion_insuficiente');
  });
});

describe('bloqueoEnFecha', () => {
  const tz = 'America/Santiago'; // UTC-4 en julio
  it('recorta un bloqueo de varios días al día consultado', () => {
    const bloqueo = {
      fechaInicio: new Date('2026-07-09T18:00:00-04:00'),
      fechaFin: new Date('2026-07-11T09:00:00-04:00'),
    };
    expect(bloqueoEnFecha(bloqueo, '2026-07-09', tz)).toEqual([
      { horaInicio: '18:00', horaFin: '24:00' },
    ]);
    expect(bloqueoEnFecha(bloqueo, '2026-07-10', tz)).toEqual([
      { horaInicio: '00:00', horaFin: '24:00' },
    ]);
    expect(bloqueoEnFecha(bloqueo, '2026-07-11', tz)).toEqual([
      { horaInicio: '00:00', horaFin: '09:00' },
    ]);
    expect(bloqueoEnFecha(bloqueo, '2026-07-12', tz)).toEqual([]);
  });

  it('convierte desde UTC a la hora local del negocio', () => {
    const bloqueo = {
      fechaInicio: new Date('2026-07-09T17:00:00Z'), // 13:00 en Santiago
      fechaFin: new Date('2026-07-09T18:30:00Z'),
    };
    expect(bloqueoEnFecha(bloqueo, '2026-07-09', tz)).toEqual([
      { horaInicio: '13:00', horaFin: '14:30' },
    ]);
  });
});
