import {
  CLAVE_RECORDATORIOS_HORA,
  CLAVE_RECORDATORIOS_HORAS_MIN,
  correspondeRecordatorio,
  fechaLocalHoy,
  horaLocalAhora,
  instanteLocal,
  parseConfigRecordatorios
} from '@tuhorafacil/agenda';
import {
  and,
  citas,
  clientasFinales,
  configuracion,
  createDb,
  eq,
  estilistas,
  isNull,
  recordatorios,
  servicios,
  tiers
} from '@tuhorafacil/db';

export function construirRecordatorio(datos: {
  clienta: string;
  hora: string;
  servicio: string;
  negocio: string;
}): string {
  return (
    `¡Hola ${datos.clienta}! 👋 Te recordamos tu hora de hoy a las ${datos.hora} ` +
    `para ${datos.servicio} en ${datos.negocio}. ¿Nos confirmas? 👇`
  );
}

/**
 * Genera los recordatorios de las citas de HOY para las cuentas con tier Pro,
 * según las reglas configurables (ver ConfigRecordatorios en packages/agenda):
 * batch matinal a la hora configurada + rezagadas con horas mínimas de aviso.
 * Idempotente (un recordatorio por cita), pensado para un cron horario.
 * Por ahora solo los persiste ('simulado'); el envío real por WhatsApp llega
 * con las plantillas aprobadas por Meta.
 */
export async function generarRecordatorios(env: Env, estilistaId?: string): Promise<number> {
  const db = createDb(env.DB);
  const hoy = fechaLocalHoy();
  const ahora = horaLocalAhora();

  const filas = await db.query.configuracion.findMany();
  const valorDe = (clave: string) => filas.find((f) => f.clave === clave)?.valor;
  const config = parseConfigRecordatorios(
    valorDe(CLAVE_RECORDATORIOS_HORA),
    valorDe(CLAVE_RECORDATORIOS_HORAS_MIN)
  );
  const inicioBatch = instanteLocal(hoy, config.horaEnvio);

  const condiciones = [
    eq(citas.fecha, hoy),
    eq(citas.estado, 'confirmada'),
    eq(estilistas.estado, 'activa'),
    eq(tiers.tieneRecordatorios, true),
    isNull(recordatorios.id)
  ];
  if (estilistaId) condiciones.push(eq(citas.estilistaId, estilistaId));

  const candidatas = await db
    .select({
      citaId: citas.id,
      estilistaId: citas.estilistaId,
      clientaId: citas.clientaId,
      horaInicio: citas.horaInicio,
      creadaAt: citas.createdAt,
      clienta: clientasFinales.nombre,
      servicio: servicios.nombre,
      negocio: estilistas.nombreNegocio
    })
    .from(citas)
    .innerJoin(estilistas, eq(citas.estilistaId, estilistas.id))
    .innerJoin(tiers, eq(estilistas.tierId, tiers.id))
    .innerJoin(clientasFinales, eq(citas.clientaId, clientasFinales.id))
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .leftJoin(recordatorios, eq(recordatorios.citaId, citas.id))
    .where(and(...condiciones));

  const pendientes = candidatas.filter((cita) =>
    correspondeRecordatorio(
      { horaInicio: cita.horaInicio, creadaAntesDelEnvio: cita.creadaAt < inicioBatch },
      ahora,
      config
    )
  );

  for (const cita of pendientes) {
    await db.insert(recordatorios).values({
      estilistaId: cita.estilistaId,
      citaId: cita.citaId,
      clientaId: cita.clientaId,
      contenido: construirRecordatorio({
        clienta: cita.clienta,
        hora: cita.horaInicio,
        servicio: cita.servicio,
        negocio: cita.negocio
      })
    });
  }

  console.log(JSON.stringify({ event: 'recordatorios_generados', fecha: hoy, cantidad: pendientes.length }));
  return pendientes.length;
}
