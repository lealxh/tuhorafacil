# Plan de Pruebas — tuhorafácil

Documento vivo. Se va marcando a medida que probamos. Estados: ⬜ pendiente · 🟡 en curso · ✅ ok · ❌ falla (anotar).

**Entorno de prueba:** cuenta "Salon de Prueba 2" (Pro), número real conectado `+56 9 8567 7493`,
clienta = WhatsApp personal de José (`56949973659`). Muchas pruebas las hace José escribiéndole
al número; las marcadas 🔬 las observa Claude en vivo (logs / D1).

---

## 1. El agente conversando (núcleo del producto)

- [ ] ⬜ **Agendar con vaguedad** — "¿tienen algo mañana en la tarde?" (sin servicio ni hora exacta). ¿Pregunta lo que falta sin inventar?
- [ ] ⬜ **Reagendar** — agenda algo, luego "mejor cámbiala para el jueves". ¿Se refleja en el calendario?
- [ ] ⬜ **Cancelar** — "cancélala". ¿Queda cancelada y libera el cupo?
- [ ] ⬜ **Fuera de horario / día cerrado** — pedir hora un domingo o a las 22:00. ¿Rechaza bien o inventa?
- [ ] ⬜ **Doble reserva** — pedir una hora ya tomada. ¿La bloquea?
- [ ] ⬜ **Consultas no-agenda** — "¿cuánto cuesta X?", "¿dónde quedan?", "¿atienden a domicilio?". ¿Responde con la info real o escala?
- [ ] ⬜ **Mensajes ambiguos / groseros** — ¿mantiene el tono y no se descarrila?
- [ ] ⬜ **No-texto (audio, sticker, foto)** — ¿pide amablemente que lo escriba?
- [ ] ⬜ **Verificar en el calendario** que cada cita agendada por chat aparece con etiqueta ✨ agente.

## 2. Coexistence (cerrar Fase 4 al 100%) 🔬

- [ ] ⬜ **Eco pausa al agente** — una "clienta" escribe; José responde manualmente desde la app **WhatsApp Business** → el agente debe callarse ~10 min en esa conversación. Claude observa el eco `business_app` y `agente_pausado_hasta` en los logs.
- [ ] ⬜ **Reanudar** — pasado el cooldown (o vía "Que siga el agente" en Mi agente), el agente vuelve a responder.

## 3. Recordatorios reales (Fase 5 — requiere desarrollo)

> Hoy los recordatorios se generan pero NO se envían por WhatsApp (solo se ven en /app/recordatorios).
> Para probar envío real falta: crear plantilla con botones en Meta vía Kapso + conectar el envío en el cron.

- [ ] ⬜ Crear la plantilla Confirmar/Reagendar en Kapso y esperar aprobación de Meta.
- [ ] ⬜ Conectar `enviarPlantilla` en el cron de recordatorios.
- [ ] ⬜ Agendar cita para mañana → verificar que llega el recordatorio real por WhatsApp con botones.
- [ ] ⬜ Tocar "Confirmar" / "Reagendar" → verificar que la respuesta llega y el agente actúa.

## 4. Límites y gasto (proteger la billetera — antes de clientas reales)

- [ ] ⬜ **Tope duro de gasto (Fase 6 — requiere desarrollo)**: hoy nada frena al agente si el gasto sube. Construir el gate + editor en /admin.
- [ ] ⬜ **Límite de mensajes del plan** — al alcanzarlo, ¿pausa con mensaje amable? (probable con cuenta de tier con límite bajo).

## 5. Multi-clienta simultánea

- [ ] ⬜ Escribir desde **dos números distintos** casi a la vez → ¿conversaciones separadas, sin mezclar contexto ni citas?

## 6. Degradación / robustez (revisar en logs)

- [ ] ⬜ ¿Qué pasa si Anthropic falla? (fallback + conversación escalada — ya implementado, confirmar en vivo).
- [ ] ⬜ Reintentos de webhook de Kapso → dedupe por `wa_id` (no responder dos veces).

---

## Orden sugerido

1. **Ahora / próxima sesión corta:** punto 1 (conversación, lo hace José) + punto 2 (coexistence, con Claude en vivo) → cierra Fase 4.
2. **Próximo bloque de desarrollo:** punto 4 tope de gasto (barato, no depende de Meta, protege plata) **o** punto 3 recordatorios reales.

## Bitácora

- 26-jul-2026: happy path completo verificado en prod (conectar self-service → agente responde → cita agendada por WhatsApp real).
