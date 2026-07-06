import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

const uuid = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestampMs = (name: string) => integer(name, { mode: 'timestamp_ms' });

export const tiers = sqliteTable('tiers', {
  id: uuid(),
  nombre: text('nombre', { enum: ['agenda', 'recepcionista', 'pro'] }).notNull().unique(),
  precioUsd: real('precio_usd').notNull(),
  limiteMensajesMes: integer('limite_mensajes_mes'),
  tieneAgente: integer('tiene_agente', { mode: 'boolean' }).notNull().default(false),
  tieneRecordatorios: integer('tiene_recordatorios', { mode: 'boolean' }).notNull().default(false),
  tieneCampanas: integer('tiene_campanas', { mode: 'boolean' }).notNull().default(false),
});

export const estilistas = sqliteTable('estilistas', {
  id: uuid(),
  // Credenciales (email/password) viven en las tablas de better-auth
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  tierId: text('tier_id')
    .notNull()
    .references(() => tiers.id),
  estado: text('estado', { enum: ['activa', 'pausada'] }).notNull().default('activa'),
  slugPublico: text('slug_publico').notNull().unique(),
  nombreNegocio: text('nombre_negocio').notNull(),
  rubro: text('rubro'),
  comuna: text('comuna'),
  bio: text('bio'),
  fotoUrl: text('foto_url'),
  waPhoneNumberId: text('wa_phone_number_id'),
  waWabaId: text('wa_waba_id'),
  waAccessTokenEnc: text('wa_access_token_enc'),
  waEstado: text('wa_estado', { enum: ['desconectado', 'conectando', 'activo', 'error'] })
    .notNull()
    .default('desconectado'),
  createdAt: timestampMs('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
});

export const servicios = sqliteTable(
  'servicios',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion'),
    duracionMin: integer('duracion_min').notNull(),
    // CLP: sin decimales
    precio: integer('precio').notNull(),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  },
  (t) => [index('servicios_estilista_idx').on(t.estilistaId)],
);

export const horarios = sqliteTable(
  'horarios',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    diaSemana: integer('dia_semana').notNull(), // 0 = domingo … 6 = sábado
    horaInicio: text('hora_inicio').notNull(), // HH:MM
    horaFin: text('hora_fin').notNull(), // HH:MM
  },
  (t) => [index('horarios_estilista_idx').on(t.estilistaId)],
);

export const bloqueos = sqliteTable(
  'bloqueos',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    fechaInicio: timestampMs('fecha_inicio').notNull(),
    fechaFin: timestampMs('fecha_fin').notNull(),
    motivo: text('motivo'),
  },
  (t) => [index('bloqueos_estilista_idx').on(t.estilistaId)],
);

export const clientasFinales = sqliteTable(
  'clientas_finales',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    telefono: text('telefono').notNull(),
    notas: text('notas'),
  },
  (t) => [
    // El teléfono identifica a la clienta dentro de cada estilista (llega del webhook de WhatsApp)
    uniqueIndex('clientas_estilista_telefono_idx').on(t.estilistaId, t.telefono),
  ],
);

export const citas = sqliteTable(
  'citas',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    clientaId: text('clienta_id')
      .notNull()
      .references(() => clientasFinales.id),
    servicioId: text('servicio_id')
      .notNull()
      .references(() => servicios.id),
    fecha: text('fecha').notNull(), // YYYY-MM-DD
    horaInicio: text('hora_inicio').notNull(), // HH:MM
    horaFin: text('hora_fin').notNull(), // HH:MM
    estado: text('estado', { enum: ['confirmada', 'cancelada', 'reagendada', 'no_show'] })
      .notNull()
      .default('confirmada'),
    origen: text('origen', { enum: ['agente', 'manual', 'web'] }).notNull(),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('citas_estilista_fecha_idx').on(t.estilistaId, t.fecha)],
);

export const conversaciones = sqliteTable(
  'conversaciones',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    clientaId: text('clienta_id')
      .notNull()
      .references(() => clientasFinales.id),
    ultimoMensajeAt: timestampMs('ultimo_mensaje_at')
      .notNull()
      .$defaultFn(() => new Date()),
    estado: text('estado', { enum: ['activa', 'escalada', 'cerrada'] }).notNull().default('activa'),
    // Coexistence: si la estilista respondió desde su teléfono, el agente se pausa un rato
    agentePausadoHasta: timestampMs('agente_pausado_hasta'),
  },
  (t) => [uniqueIndex('conversaciones_estilista_clienta_idx').on(t.estilistaId, t.clientaId)],
);

export const mensajes = sqliteTable(
  'mensajes',
  {
    id: uuid(),
    conversacionId: text('conversacion_id')
      .notNull()
      .references(() => conversaciones.id, { onDelete: 'cascade' }),
    rol: text('rol', { enum: ['clienta', 'agente', 'estilista'] }).notNull(),
    contenido: text('contenido').notNull(),
    tokensEntrada: integer('tokens_entrada'),
    tokensSalida: integer('tokens_salida'),
    timestamp: timestampMs('timestamp')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('mensajes_conversacion_idx').on(t.conversacionId, t.timestamp)],
);

export const configAgente = sqliteTable('config_agente', {
  id: uuid(),
  estilistaId: text('estilista_id')
    .notNull()
    .unique()
    .references(() => estilistas.id, { onDelete: 'cascade' }),
  personalidad: text('personalidad').notNull().default('cercana'),
  msgBienvenida: text('msg_bienvenida'),
  instrucciones: text('instrucciones'),
  infoExtra: text('info_extra'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

export const consumoMensual = sqliteTable(
  'consumo_mensual',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    mes: text('mes').notNull(), // formato YYYY-MM
    mensajesAgente: integer('mensajes_agente').notNull().default(0),
    tokensEntrada: integer('tokens_entrada').notNull().default(0),
    tokensSalida: integer('tokens_salida').notNull().default(0),
    conversacionesMeta: integer('conversaciones_meta').notNull().default(0),
    citasCreadas: integer('citas_creadas').notNull().default(0),
    costoEstimadoUsd: real('costo_estimado_usd').notNull().default(0),
  },
  (t) => [uniqueIndex('consumo_estilista_mes_idx').on(t.estilistaId, t.mes)],
);

export const suscripciones = sqliteTable(
  'suscripciones',
  {
    id: uuid(),
    estilistaId: text('estilista_id')
      .notNull()
      .references(() => estilistas.id, { onDelete: 'cascade' }),
    tierId: text('tier_id')
      .notNull()
      .references(() => tiers.id),
    // CLP: sin decimales. Monto cobrado en el cambio de plan
    montoClp: integer('monto_clp').notNull(),
    metodoPago: text('metodo_pago').notNull().default('mock_webpay'),
    // 'pagado_mock' mientras la pasarela real no esté integrada
    estado: text('estado').notNull().default('pagado_mock'),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('suscripciones_estilista_idx').on(t.estilistaId)],
);

export const plantillasWa = sqliteTable('plantillas_wa', {
  id: uuid(),
  // Pre-aprobadas a nivel de plataforma (Tech Provider); sirven para todas las estilistas
  nombre: text('nombre').notNull().unique(),
  waTemplateId: text('wa_template_id'),
  idioma: text('idioma').notNull().default('es'),
  parametrosJson: text('parametros_json', { mode: 'json' }),
});
