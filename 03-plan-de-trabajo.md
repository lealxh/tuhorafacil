# Plan de Trabajo — MVP TuHoraFácil

**Versión:** 1.1
**Fecha:** 5 de julio 2026 · **Última actualización de estado:** 6 de julio 2026
**Horizonte:** ~14 semanas → demo en vivo en octubre 2026
**Insumos:** `01-requerimientos-funcionales.md` (v0.2), `02-especificaciones-tecnicas2.md` (v0.3), diseño UI aprobado (`Tuhorafacil.dc.html` en claude.ai/design)

---

## 0. ESTADO DE AVANCE (leer primero — contexto para retomar el trabajo)

> Actualizado el 6-jul-2026. El proyecto va **muy adelantado respecto al cronograma**: en la semana 1 se completó lo planificado hasta ~semana 11. Fases 0 y 1 completas; Fase 2 completa salvo Embedded Signup (bloqueado por Meta); de Fase 3 falta recordatorios, admin y hardening.

### ✅ Terminado y desplegado (verificado end-to-end)

| Área | Detalle | Dónde |
|---|---|---|
| **Fase 0 completa** | Monorepo pnpm, D1 + Drizzle (migraciones 0000–0003), CI GitHub Actions, ambos Workers desplegados | `tuhorafacil-web` y `tuhorafacil-api` en `*.tuhorafacil.workers.dev` |
| **Motor de agendamiento** | Slots, validación, solapamientos, anticipación (cruza medianoche), bloqueos multi-día TZ Chile. **20 tests en verde** | `packages/core` |
| **Lógica de dominio compartida** | `crearCita` con **insert atómico anti doble-booking** (`INSERT…WHERE NOT EXISTS`, D1 single-writer), bloqueos, slots, fechas. La usan web Y agente — nunca duplicar | `packages/agenda` |
| **Auth** | better-auth (email+password), tablas en `packages/db/src/auth-schema.ts`, `estilistas.user_id` FK. Login/registro/cambio de contraseña/logout probados | `apps/web/src/lib/server/auth.ts`, `hooks.server.ts` |
| **Onboarding** | Wizard 4 pasos (negocio→servicios→horarios→WhatsApp "muy pronto"), slug autogenerado, tier Agenda default | `/app/onboarding` |
| **Dashboard 5 tabs + Cuenta** | Hoy (card agente + escalados), Calendario (día/semana/mes + sheet Nueva cita + bloqueos), Mi agente (toggle/personalidad/instrucciones/escalados con "Que siga el agente"/"Responder yo"), Mi página (mantenedor con 3 tabs: página+bio, servicios con toggles, horarios), Consumo/Plan (barras de uso, comparativa), Cuenta (perfil/contraseña/logout, llega por el avatar) | `apps/web/src/routes/app/*` |
| **Diseño móvil + desktop** | Móvil 390px fiel al mock; desktop: sidebar 236px, header con "+ Nueva cita", layouts 2 columnas, semana con grilla horaria 7 col, preview en vivo (iframe) en Mi página. Verificado con Playwright sin overflow | `+layout.svelte` de `/app` |
| **Agente WhatsApp (F1)** | Webhook GET verify + POST `waitUntil`, gates (tier→activo→cooldown Coexistence→límite mensual), Claude Haiku (`claude-haiku-4-5`) con 5 tools strict, historial últimos 30 mensajes, metering en `consumo_mensual`, degradación con gracia. **Probado en vivo**: conversación completa crea cita real; doble booking rechazado; escalada funciona; eco de estilista pausa el agente 10 min | `apps/api/src/agente/` + `routes/webhook.ts` |
| **Página pública (F6)** | `/@slug` (landing con bio/servicios/horarios) + `/@slug/reservar` (servicio→fecha→slot→datos→confirmación, origen `web`). Los 3 canales (manual/agente/web) comparten motor sin pisarse — verificado | `apps/web/src/routes/[slug=arroba]/` |
| **Metering (F9)** | Tokens+mensajes+citas por mes, límite pausa al agente con mensaje amable, barra de uso con aviso al 80% | orquestador + `/app/plan` |
| **Probar agente en navegador** (herramienta de test, no demo) | Canal de prueba sin WhatsApp: `POST /mock/chat` reusa el core `correrAgente` con una clienta sintética `WEB_DEMO`, mismos gates salvo `waEstado`. UI de chat en `/app/probar-agente` (entrada desde «Mi agente»). Verificado en vivo: responde con servicios reales, agenda cita real, respeta el gate por tier | `apps/api/src/agente/simular.ts` + `routes/mock.ts`; `apps/web/.../probar-agente` |
| **Cambio de plan + pago mockeado** | `/app/plan` con tarjetas clicables → `/app/plan/checkout` (pantalla estilo Webpay que siempre aprueba) → registra `suscripciones` y cambia `estilistas.tier_id` (desbloquea el agente al instante). La pasarela real (Webpay/Flow/Mercado Pago) se enchufa en la acción `pagar` | tabla `suscripciones` (migración 0004); `apps/web/.../plan` + `plan/checkout` |
| **Panel admin (F8)** | Route group `/admin` con guard por `user.role='admin'` (columna nueva; se re-consulta en `esAdmin`). Tabla de cuentas (tier, estado, waEstado, mensajes y **costo USD** del mes), cambiar tier, pausar/reactivar. Costo: `registrarConsumo` ahora calcula `costo_estimado_usd` con precios Haiku 4.5. **Sin** tope duro con bloqueo (queda en hardening). Verificado en vivo: pausar → el agente se frena en el chat de prueba | migración 0005 (`user.role`); `apps/web/src/routes/admin/*`; `orquestador.ts` |
| **Editar cita (F4)** | Primitivo de dominio `editarCita` en `packages/agenda` (reusa `validarCita`/`finDeCita` + guard atómico anti-solapamiento, con `excluirCitaId` para no chocar consigo misma). Edita servicio/fecha/hora **in situ** (misma fila, preserva `origen`). Hoja de edición en el calendario. 21 tests en verde (nuevo test de auto-solapamiento). Verificado en vivo | `packages/agenda/src/citas.ts`; `apps/web/.../calendario` |
| **Foto de perfil (F5)** | Bucket R2 privado `tuhorafacil-fotos` (binding `FOTOS`) + ruta `GET /fotos/[...key]` que la sirve. Acción `foto` en «Mi página» (multipart, valida tipo/≤3MB, borra la anterior, `put` con ArrayBuffer). Aparece en el mantenedor y en `/@slug`. Verificado en vivo. Prod: crear el bucket con `wrangler r2 bucket create tuhorafacil-fotos` | migración 0005 (`estilistas.foto_url`); `apps/web/.../pagina`, `routes/fotos/[...key]` |

### ⚠️ Detalles operativos que el próximo modelo debe saber

- **Cuenta Cloudflare**: subdominio `tuhorafacil.workers.dev`, D1 `tuhorafacil` (id `b25d7de6-…`, región ENAM). Secrets ya cargados: API → `WA_VERIFY_TOKEN` (valor prod en `apps/api/.dev.vars.prod`, local y gitignorado; necesario al configurar Meta), `ANTHROPIC_API_KEY`, `WA_ACCESS_TOKEN`, `MOCK_CHAT_SECRET`; web → `BETTER_AUTH_SECRET`, `MOCK_CHAT_SECRET`.
- **Demo local**: login `visual@test.cl` / `clave12345` (dueño de Salón Regias local, con citas/escalados/consumo de prueba). Webhook simulado: POST a `/webhook/whatsapp` con `phone_number_id: "DEMO_PHONE_ID"`.
- **Import de drizzle-orm**: SIEMPRE importar operadores (`eq`, `and`…) desde `@tuhorafacil/db`, nunca de `drizzle-orm` directo (pnpm crea instancias paralelas y los tipos no calzan).
- Deploy manual: `pnpm --filter @tuhorafacil/web run deploy` (con `run`; sin él choca con `pnpm deploy`).
- El prompt del agente tiene reglas anti-alucinación afinadas con pruebas reales (regla dura: "cita existe SOLO cuando crear_cita devuelve ok"; `fecha_legible` viene de la tool). No relajarlas sin retest.

### ❌ Pendiente (en orden sugerido)

| # | Qué | Notas |
|---|---|---|
| 1 | **Recordatorios (F7, Cron Triggers)** | Infraestructura construible ya (cron + query de citas próximas + registro en `conversaciones_meta`); el envío real necesita plantillas aprobadas por Meta. Dejar el envío tras el mismo patrón degradante de `enviarTexto` |
| 2 | **Embedded Signup (F10)** | **BLOQUEADO por trámite Meta** (Tech Provider — responsabilidad de José, iniciado ~jul 2026). Al desbloquear: popup JS SDK en onboarding paso 4 + callback que canjea código OAuth → guardar `wa_waba_id`, `wa_phone_number_id`, token **cifrado** (`wa_access_token_enc`, definir cifrado con `WA_APP_SECRET`), suscribir webhook, `wa_estado='activo'`. Validar firma `X-Hub-Signature-256` en el webhook (TODO marcado en `routes/webhook.ts`) |
| 3 | **Recuperación de contraseña** | better-auth lo trae, pero requiere servicio de email (ej. Cloudflare Email o Resend) |
| 4 | **Hardening pre-demo** | Rate limiting del webhook, **tope duro de gasto con bloqueo** (hoy el costo se calcula y muestra en el panel, pero sin gate que pause; falta el bloqueo), política de retención de conversaciones (requisito legal), revisar índices D1 |
| 5 | **Pruebas del dueño** | José está probando la app y traerá lista de mejoras UX |

### Riesgos vigentes

- **Meta es el camino crítico** (riesgo #1): sin Tech Provider aprobado no hay demo con número real. Todo lo demás puede demostrarse con webhook simulado.
- Los mensajes del cambio Neon→D1 (5-jul), y decisión better-auth en vez de Lucia (deprecada), ya están reflejados en CLAUDE.md.

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
| Auth | better-auth (email + contraseña) — decidido el 5-jul-2026; Lucia (del spec) fue descartada por estar deprecada |
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
| H1 ✅ 5-jul | Semana 1 | App y API desplegadas en Cloudflare; BD migrada; `GET /health` responde |
| H2 ✅ 5-jul | Semana 3 | Registro + login desde el celular; CRUD de servicios y horarios funcionando |
| H3 ✅ 5-jul | Semana 5 | Creo una cita manual desde el calendario móvil; el motor rechaza un doble booking y respeta bloqueos (tests en verde) |
| H4 ✅ 5-jul | Semana 8 | Escribo al número de prueba por WhatsApp y el agente responde con servicios y precios reales de la BD |
| H5 ✅ 5-jul (webhook simulado) | Semana 10 | 🏁 Flujo demo completo: conversación → cita creada → visible en calendario → sin respuestas duplicadas si intervengo desde el teléfono |
| H6 ◐ parcial (reserva web ✅ 5-jul; recordatorios pendientes) | Semana 12 | Reserva desde la página pública `/@slug` + recordatorio automático enviado por Cron Trigger |
| H7 ⏳ bloqueado por Meta | Semana 14 | Ensayo de la demo con una estilista real conectando su propio número vía Embedded Signup |

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
