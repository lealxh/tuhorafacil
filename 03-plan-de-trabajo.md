# Plan de Trabajo — MVP TuHoraFácil

**Versión:** 1.0
**Fecha:** 5 de julio 2026
**Horizonte:** ~14 semanas → demo en vivo en octubre 2026
**Insumos:** `01-requerimientos-funcionales.md` (v0.2), `02-especificaciones-tecnicas2.md` (v0.3), diseño UI aprobado (`Tuhorafacil.dc.html` en claude.ai/design)

---

## 1. Resumen y objetivo

Construir el MVP de tuhorafácil para la demo de octubre. El criterio de éxito es un solo flujo mostrado en vivo:

> Una "clienta" escribe por WhatsApp → el agente responde y agenda → la cita aparece en el calendario de la estilista → llega la confirmación.

Todo el plan está ordenado para que ese flujo funcione end-to-end lo antes posible (fin de Fase 2, semana 10) y las semanas restantes sean pulido, página pública y preparación del lanzamiento — no desarrollo de riesgo.

---

## 2. Insumos y decisiones ya tomadas

### 2.1 Stack (decidido — no sustituir)

| Capa | Tecnología |
|---|---|
| Frontend / SSR | SvelteKit + `@sveltejs/adapter-cloudflare` + Tailwind CSS |
| API + webhook | Hono.js en Cloudflare Workers |
| Base de datos | Cloudflare D1 (SQLite) + Drizzle ORM — decidido el 5-jul-2026, reemplaza al Neon/Postgres del spec |
| Auth | Lucia Auth (email + contraseña) |
| LLM | Anthropic API — Claude Haiku con tool use estricto |
| Jobs programados | Cloudflare Cron Triggers |

### 2.2 Decisiones que fija el diseño UI

El mock aprobado define decisiones que impactan directamente el desarrollo:

- **Mobile-first.** La app se diseñó primero como teléfono (390px, bottom tabs); el desktop es una variante con sidebar. Desarrollar cada pantalla en móvil primero.
- **5 secciones de navegación** (bottom tabs en móvil, sidebar en desktop):
  1. **Hoy** — saludo, card "Tu agente estuvo trabajando" (actividad del agente), stats del día (confirmadas / hora libre / ingreso estimado), lista de citas del día con badge "✨ agente", escalados pendientes.
  2. **Calendario** — vistas día / semana / mes, navegación entre semanas.
  3. **Mi agente** — toggle activo/pausado, personalidad (Cercana / Neutral / Formal), instrucciones en texto libre con chips de resumen, stats (mensajes/mes, % agenda sola), escalados pendientes.
  4. **Mi página** — link `tuhorafacil.cl/@slug` con copiar, editor de foto y bio, toggles de visibilidad por servicio, vista previa en vivo.
  5. **Consumo / Plan** — plan actual, barras de uso del mes, comparativa de los 3 planes (Agenda $19.000 / Recepcionista $28.500 / Pro $52.250 CLP).
- **Onboarding wizard de 4 pasos:** datos del negocio (nombre, rubro, comuna) → servicios (nombre, duración, precio) → horarios por día → conectar WhatsApp (Embedded Signup de Meta). Termina con el agente activo.
- **Página pública** (`tuhorafacil.cl/@slug`): portada con foto, nombre, comuna, bio, botón "Reservar una hora", lista de servicios con botón Reservar individual, horarios de atención, footer "Hecho con tuhorafácil".
- **Sheets modales:** "Nueva cita" (cliente, servicio, fecha, hora) y "Escalado" (conversación con la clienta + acciones "Que siga el agente" / "Responder yo").
- **Design tokens** → base del config de Tailwind:
  - Fuente: Onest (Google Fonts)
  - Primario coral `#D97F6A` (gradiente a `#E0937E`), fondo `#FCF0EB` / `#FCF6F3`, texto `#3E2C2A`, secundario `#A08581`, éxito `#5FBE8E`, superficie blanca con sombras suaves `rgba(160,90,70,…)`
  - Bordes muy redondeados (14–22px), pills, botones con gradiente
  - Copy en español chileno, precios en CLP
- **Pantallas sin diseño aún** (resolver durante el desarrollo siguiendo el mismo lenguaje visual): login/registro/recuperación, panel de administración, flujo paso a paso de reserva en la página pública (servicio → slot → datos → confirmación).

---

## 3. Plan por fases

### Fase 0 — Fundaciones (semana 1 · 6–12 jul)

| Tarea | Detalle |
|---|---|
| Setup del repo | Monorepo: app SvelteKit + Worker Hono + paquete compartido (esquema Drizzle, tipos, motor de agendamiento) |
| SvelteKit | `@sveltejs/adapter-cloudflare`, Tailwind con los design tokens del mock |
| Worker API | Hono con estructura de rutas y deploy a Cloudflare (plan pago desde el día 1 — el límite de 10ms CPU del plan gratuito no soporta llamadas al LLM) |
| Base de datos | Cloudflare D1 + Drizzle con el esquema completo del spec §2.3 (12 tablas), migraciones y seed de desarrollo (estilista demo, servicios, horarios) |
| CI/CD | Deploy automático a Cloudflare en cada push |

**Entregable:** app y API desplegadas en Cloudflare, BD migrada con seed.

### Fase 1 — Núcleo de datos (semanas 2–5 · 13 jul – 9 ago)

| Semana | Tarea |
|---|---|
| 2 | Auth con Lucia (registro, login, recuperación de contraseña, perfil) + tabla `tiers` y gating de features por tier (data-driven, no hardcodeado) |
| 2–3 | CRUD de servicios, horarios semanales y bloqueos (API + pantallas) |
| 3–4 | **Motor de agendamiento** (F2): lógica pura con tests exhaustivos — cálculo de slots según horarios, duración del servicio, bloqueos y citas existentes; anticipación mínima; **`crear_cita` atómico** — verificación de conflicto + insert en un solo `batch()` de D1, que es single-writer (riesgo #5: doble booking) |
| 4–5 | UI del dashboard: pantalla **Hoy**, **Calendario** día/semana/mes, sheet **Nueva cita**, crear/editar/cancelar citas, bloquear horarios |

**Entregable:** una estilista se registra, configura su negocio y gestiona su agenda manualmente desde el celular.

### Fase 2 — El agente (semanas 6–10 · 10 ago – 13 sep) 🔴 fase crítica

| Semana | Tarea |
|---|---|
| 6 | Webhook de WhatsApp: verificación de Meta, respuesta 200 inmediata + `ctx.waitUntil()` para procesar en background; persistencia de `conversaciones` y `mensajes` |
| 6–7 | Handler de Embedded Signup: intercambio del código OAuth, almacenamiento cifrado del token, suscripción del webhook al número, estados `desconectado → conectando → activo → error` |
| 7–9 | **Agente IA** (F1): Claude Haiku con las 5 tools (`consultar_disponibilidad`, `crear_cita`, `reagendar_cita`, `cancelar_cita`, `escalar_a_estilista`), system prompt desde config del negocio + personalidad, historial recortado a últimos N mensajes, caché del system prompt |
| 8–9 | Coexistence: detectar mensajes salientes de la estilista y poner la conversación en cooldown (riesgo #2: respuestas duplicadas) |
| 9 | Metering (F9): registro de tokens y mensajes por cuenta en `consumo_mensual`, pausa del agente al llegar al límite con mensaje amable |
| 9–10 | Pantalla **Mi agente** (F4): toggle, personalidad, instrucciones + sheet **Escalado** con "Que siga el agente" / "Responder yo" |
| 10 | **Onboarding wizard** de 4 pasos completo, terminando en Embedded Signup |
| 10 | 🏁 **Hito demo:** flujo completo end-to-end con número de prueba |

**Entregable:** la demo de octubre funciona. Lo que sigue es soporte, no riesgo.

### Fase 3 — Lanzamiento (semanas 11–14 · 14 sep – 11 oct)

| Semana | Tarea |
|---|---|
| 11 | **Página pública** (F6): ruta `/@slug` SSR sin login, flujo de reserva (servicio → slots → datos → confirmación), botón WhatsApp |
| 12 | **Recordatorios** (F7, tier Pro): Cron Triggers + envío de plantillas aprobadas (confirmación, recordatorio X horas antes, notificación a la estilista) |
| 12 | Pantalla **Consumo / Plan**: barras de uso, comparativa de planes |
| 13 | **Panel admin** (F8): login con rol admin, tabla de cuentas (tier, estado WhatsApp, consumo, costo estimado), cambiar tier, pausar cuenta, **tope duro de gasto por cuenta** (riesgo #6) |
| 13–14 | Hardening: degradación con gracia si el LLM falla ("te respondo en un momento"), manejo de errores del webhook, política de retención de conversaciones |
| 14 | Ensayo completo de la demo con estilistas reales del socio; buffer para imprevistos |

---

## 4. Workstream paralelo — trámites Meta (no es código)

**Iniciar de inmediato — el lead time de Meta es el riesgo #1 del proyecto y no depende del desarrollo.**

| Trámite | Cuándo iniciar | Bloquea a |
|---|---|---|
| Verificación del negocio como **Tech Provider** | Julio (ya) | Embedded Signup en producción |
| Revisión del flujo de **Embedded Signup** por Meta | Agosto (apenas exista el handler, semana 7) | Que estilistas reales conecten su número |
| Aprobación de **plantillas** (confirmación, recordatorio, límite de plan) | Agosto | Recordatorios del tier Pro (semana 12) |

Mientras los trámites avanzan, el desarrollo usa la WABA propia y números de prueba — nada del cronograma de código se bloquea, pero la noche del evento sí requiere los trámites listos.

---

## 5. Hitos verificables

| # | Fin de | Criterio de aceptación |
|---|---|---|
| H1 | Semana 1 | App y API desplegadas en Cloudflare; BD migrada; `GET /health` responde |
| H2 | Semana 3 | Registro + login desde el celular; CRUD de servicios y horarios funcionando |
| H3 | Semana 5 | Creo una cita manual desde el calendario móvil; el motor rechaza un doble booking y respeta bloqueos (tests en verde) |
| H4 | Semana 8 | Escribo al número de prueba por WhatsApp y el agente responde con servicios y precios reales de la BD |
| H5 | Semana 10 | 🏁 Flujo demo completo: conversación → cita creada → visible en calendario → sin respuestas duplicadas si intervengo desde el teléfono |
| H6 | Semana 12 | Reserva desde la página pública `/@slug` + recordatorio automático enviado por Cron Trigger |
| H7 | Semana 14 | Ensayo de la demo con una estilista real conectando su propio número vía Embedded Signup |

---

## 6. Riesgos y mitigaciones

| # | Riesgo (spec §5) | Mitigación | Cuándo |
|---|---|---|---|
| 1 | Tiempos de Meta (Tech Provider, plantillas) | Iniciar trámites en julio/agosto, no septiembre | Semana 1 (§4) |
| 2 | Coexistence: respuestas duplicadas | Detectar mensaje saliente → cooldown de conversación | Semanas 8–9 |
| 3 | Límite de CPU en Workers | Plan pago (30s CPU) desde el día 1 | Semana 1 |
| 4 | Alucinaciones del agente | Tool use estricto; el agente solo cita datos de la config; validación backend de cada tool | Semanas 7–9 |
| 5 | Concurrencia de citas | `crear_cita` atómico (batch D1 single-writer), con test de concurrencia | Semanas 3–4 |
| 6 | Costos sin control en período gratuito | Metering desde semana 9 + tope duro por cuenta en admin | Semanas 9 y 13 |

---

## 7. Fuera de alcance (no construir en el MVP)

Cobros / pasarela de pago · emisión de boletas SII · UI de campañas masivas (solo queda lista la infraestructura de plantillas) · exportación a Google Calendar · CRM de clientas · cobro de suscripción automatizado · app móvil nativa (el MVP es web responsive).
