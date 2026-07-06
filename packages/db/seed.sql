-- Seed de desarrollo: 3 tiers + estilista demo "Salón Regias"
-- Aplicar con: wrangler d1 execute tuhorafacil --file ../../packages/db/seed.sql [--remote]
-- UUIDs fijos para que el seed sea idempotente (INSERT OR IGNORE)

INSERT OR IGNORE INTO tiers (id, nombre, precio_usd, limite_mensajes_mes, tiene_agente, tiene_recordatorios, tiene_campanas) VALUES
  ('11111111-0000-4000-8000-000000000001', 'agenda', 20, NULL, 0, 0, 0),
  ('11111111-0000-4000-8000-000000000002', 'recepcionista', 30, 500, 1, 0, 0),
  ('11111111-0000-4000-8000-000000000003', 'pro', 55, 500, 1, 1, 1);

-- Usuario de better-auth sin fila en account (sin password): no puede iniciar sesión.
-- Para entrar como demo, registrarse desde la app con otro email.
INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at) VALUES
  ('77777777-0000-4000-8000-000000000001', 'Camila', 'camila@demo.tuhorafacil.cl', 1,
   unixepoch() * 1000, unixepoch() * 1000);

-- wa_phone_number_id DEMO_PHONE_ID: permite simular webhooks de Meta en desarrollo
INSERT OR IGNORE INTO estilistas (id, user_id, nombre, tier_id, estado, slug_publico, nombre_negocio, wa_phone_number_id, wa_estado, created_at) VALUES
  ('22222222-0000-4000-8000-000000000001', '77777777-0000-4000-8000-000000000001', 'Camila',
   '11111111-0000-4000-8000-000000000002', 'activa', 'salonregias', 'Salón Regias', 'DEMO_PHONE_ID', 'activo',
   unixepoch() * 1000);

INSERT OR IGNORE INTO servicios (id, estilista_id, nombre, duracion_min, precio, activo) VALUES
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Corte + brushing', 60, 25000, 1),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Balayage', 180, 90000, 1),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Color raíz', 90, 45000, 1),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Peinado evento', 60, 30000, 1);

-- Lunes a viernes 10:00–19:00, sábado 10:00–15:00
INSERT OR IGNORE INTO horarios (id, estilista_id, dia_semana, hora_inicio, hora_fin) VALUES
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 1, '10:00', '19:00'),
  ('44444444-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 2, '10:00', '19:00'),
  ('44444444-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 3, '10:00', '19:00'),
  ('44444444-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 4, '10:00', '19:00'),
  ('44444444-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 5, '10:00', '19:00'),
  ('44444444-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 6, '10:00', '15:00');

INSERT OR IGNORE INTO config_agente (id, estilista_id, personalidad, instrucciones, activo) VALUES
  ('55555555-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'cercana',
   'Tuteo chileno. Confirmar 1 día antes. Pedir abono del 30% para balayage.', 1);

INSERT OR IGNORE INTO clientas_finales (id, estilista_id, nombre, telefono) VALUES
  ('66666666-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Valentina Pérez', '+56987654321'),
  ('66666666-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Francisca Soto', '+56912345678');
