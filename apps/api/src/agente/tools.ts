import type Anthropic from '@anthropic-ai/sdk';
import { cancelarCita, crearCita, fechaLegible, slotsParaServicio } from '@tuhorafacil/agenda';
import { and, citas, clientasFinales, conversaciones, eq, servicios, type Db } from '@tuhorafacil/db';

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'consultar_disponibilidad',
    description:
      'Consulta los horarios realmente disponibles para un servicio en una fecha. Úsala SIEMPRE antes de ofrecer horas.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha a consultar, formato YYYY-MM-DD' },
        servicio_id: { type: 'string', description: 'id del servicio (de la lista de servicios)' }
      },
      required: ['fecha', 'servicio_id'],
      additionalProperties: false
    }
  },
  {
    name: 'crear_cita',
    description: 'Crea una cita confirmada. Úsala solo después de que la clienta confirmó servicio, fecha y hora.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'YYYY-MM-DD' },
        hora: { type: 'string', description: 'HH:MM, una hora que consultar_disponibilidad haya ofrecido' },
        servicio_id: { type: 'string' },
        nombre_clienta: { type: 'string', description: 'Nombre de la clienta tal como lo dio en la conversación' },
        telefono_clienta: {
          type: 'string',
          description:
            'Teléfono con WhatsApp de la clienta, con código de país (ej: +56912345678). SOLO en el chat web, donde la clienta es anónima; en WhatsApp deja cadena vacía.'
        }
      },
      required: ['fecha', 'hora', 'servicio_id', 'nombre_clienta'],
      additionalProperties: false
    }
  },
  {
    name: 'reagendar_cita',
    description: 'Mueve una cita existente de la clienta a una nueva fecha y hora.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'string', description: 'cita_id de la lista de citas próximas de la clienta' },
        nueva_fecha: { type: 'string', description: 'YYYY-MM-DD' },
        nueva_hora: { type: 'string', description: 'HH:MM' }
      },
      required: ['cita_id', 'nueva_fecha', 'nueva_hora'],
      additionalProperties: false
    }
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela una cita existente de la clienta.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'string' },
        motivo: { type: 'string', description: 'Motivo que dio la clienta' }
      },
      required: ['cita_id', 'motivo'],
      additionalProperties: false
    }
  },
  {
    name: 'escalar_a_estilista',
    description:
      'Marca la conversación para que la estilista la responda personalmente. Úsala cuando no puedas o no debas resolver algo.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', description: 'Resumen breve de qué necesita la clienta' }
      },
      required: ['motivo'],
      additionalProperties: false
    }
  }
];

export interface ContextoTools {
  db: Db;
  estilistaId: string;
  clientaId: string;
  /** WhatsApp: teléfono de la clienta. Web: placeholder 'web:<token>' (la clienta es anónima) */
  telefono: string;
  conversacionId: string;
  /** Canal de origen para las citas que cree el agente (default 'agente' = WhatsApp) */
  origen?: 'agente' | 'web';
  /** Se marca cuando crear_cita tiene éxito, para el metering */
  citasCreadas: { count: number };
  /** true si crear_cita o reagendar_cita tuvieron éxito en este turno (red anti-alucinación) */
  agendo: { valor: boolean };
}

async function citaDeLaClienta(ctx: ContextoTools, citaId: string) {
  return ctx.db.query.citas.findFirst({
    where: and(eq(citas.id, citaId), eq(citas.estilistaId, ctx.estilistaId), eq(citas.clientaId, ctx.clientaId), eq(citas.estado, 'confirmada'))
  });
}

export async function ejecutarTool(ctx: ContextoTools, nombre: string, input: Record<string, unknown>): Promise<string> {
  // Log sin datos personales (fecha/servicio) para diagnosticar el uso de herramientas
  console.log(JSON.stringify({ event: 'tool', nombre, fecha: input.fecha ?? input.nueva_fecha, servicioId: input.servicio_id }));
  switch (nombre) {
    case 'consultar_disponibilidad': {
      // Pasos de 30 min para ofrecer: lista completa del día sin truncar
      const r = await slotsParaServicio(ctx.db, ctx.estilistaId, String(input.servicio_id), String(input.fecha), 30);
      if ('error' in r) return JSON.stringify(r);
      return JSON.stringify({
        servicio: r.servicio,
        fecha: input.fecha,
        fecha_legible: fechaLegible(String(input.fecha)),
        horas_disponibles: r.slots
      });
    }

    case 'crear_cita': {
      const nombre_clienta = String(input.nombre_clienta).trim();
      // Web: la clienta es anónima → el teléfono lo aporta el agente (telefono_clienta)
      const esWeb = ctx.telefono.startsWith('web:');
      const telefonoDado = input.telefono_clienta ? String(input.telefono_clienta).trim().replace(/\s/g, '') : '';
      if (esWeb && !/^\+?\d{8,15}$/.test(telefonoDado)) {
        return JSON.stringify({
          error: 'Pídele a la clienta su teléfono con WhatsApp (con código de país, ej +56912345678) antes de agendar.'
        });
      }
      const telefono = esWeb ? (telefonoDado.startsWith('+') ? telefonoDado : `+${telefonoDado}`) : ctx.telefono;

      const r = await crearCita(ctx.db, ctx.estilistaId, {
        clientaNombre: nombre_clienta,
        telefono,
        servicioId: String(input.servicio_id),
        fecha: String(input.fecha),
        horaInicio: String(input.hora),
        origen: ctx.origen ?? 'agente'
      });
      if ('error' in r) return JSON.stringify(r);
      // En WhatsApp la clienta del contexto es quien agenda; en web la clienta real la crea crearCita por su teléfono
      if (nombre_clienta && !esWeb) {
        await ctx.db.update(clientasFinales).set({ nombre: nombre_clienta }).where(eq(clientasFinales.id, ctx.clientaId));
      }
      ctx.citasCreadas.count++;
      ctx.agendo.valor = true;
      return JSON.stringify({
        ok: true,
        cita_id: r.id,
        fecha_legible: fechaLegible(String(input.fecha)),
        hora: input.hora
      });
    }

    case 'reagendar_cita': {
      const cita = await citaDeLaClienta(ctx, String(input.cita_id));
      if (!cita) return JSON.stringify({ error: 'No encontré esa cita.' });
      await cancelarCita(ctx.db, ctx.estilistaId, cita.id);
      const r = await crearCita(ctx.db, ctx.estilistaId, {
        clientaNombre: '-',
        telefono: ctx.telefono,
        servicioId: cita.servicioId,
        fecha: String(input.nueva_fecha),
        horaInicio: String(input.nueva_hora),
        origen: 'agente'
      });
      if ('error' in r) {
        // La nueva hora no sirvió: restaurar la cita original
        await ctx.db.update(citas).set({ estado: 'confirmada' }).where(eq(citas.id, cita.id));
        return JSON.stringify(r);
      }
      await ctx.db.update(citas).set({ estado: 'reagendada' }).where(eq(citas.id, cita.id));
      ctx.agendo.valor = true;
      return JSON.stringify({
        ok: true,
        cita_id: r.id,
        fecha_legible: fechaLegible(String(input.nueva_fecha)),
        hora: input.nueva_hora
      });
    }

    case 'cancelar_cita': {
      const cita = await citaDeLaClienta(ctx, String(input.cita_id));
      if (!cita) return JSON.stringify({ error: 'No encontré esa cita.' });
      await cancelarCita(ctx.db, ctx.estilistaId, cita.id);
      return JSON.stringify({ ok: true });
    }

    case 'escalar_a_estilista': {
      await ctx.db
        .update(conversaciones)
        .set({ estado: 'escalada' })
        .where(eq(conversaciones.id, ctx.conversacionId));
      console.log(JSON.stringify({ event: 'conversacion_escalada', conversacionId: ctx.conversacionId, motivo: input.motivo }));
      return JSON.stringify({ ok: true, nota: 'La estilista fue notificada y responderá personalmente.' });
    }

    default:
      return JSON.stringify({ error: `Herramienta desconocida: ${nombre}` });
  }
}
