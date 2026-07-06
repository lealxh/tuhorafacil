# tuhorafácil

App de agendamiento con agente IA en WhatsApp para estilistas independientes. Specs en `01-requerimientos-funcionales.md`, `02-especificaciones-tecnicas2.md` y cronograma en `03-plan-de-trabajo.md`.

## Estructura

| Ruta | Qué es |
|---|---|
| `apps/web` | Dashboard + página pública — SvelteKit + Tailwind, deploy a Cloudflare Workers |
| `apps/api` | API REST + webhook WhatsApp — Hono en Cloudflare Workers |
| `packages/db` | Esquema Drizzle (Cloudflare D1 / SQLite), migraciones y seed |
| `packages/agenda` | Lógica de dominio compartida: citas, bloqueos, slots, fechas |
| `packages/core` | Motor de agendamiento puro (slots, validación) con tests |

## Requisitos

- Node 24+, pnpm 11+
- Cuenta de Cloudflare (`wrangler login`) con Workers en plan pago (las llamadas al LLM superan los 10ms de CPU del plan gratuito)

## Setup local

```bash
pnpm install
pnpm db:migrate   # aplica migraciones a la D1 local (miniflare)
pnpm db:seed      # 3 tiers + estilista demo "Salón Regias"
cp apps/web/.dev.vars.example apps/web/.dev.vars   # y generar BETTER_AUTH_SECRET (openssl rand -base64 32)
```

Auth con [better-auth](https://better-auth.com) (email + contraseña). En producción el secret vive en el Worker: `cd apps/web && npx wrangler secret put BETTER_AUTH_SECRET`. Ambos Workers comparten la misma D1; en dev local la web reutiliza el estado de `apps/api/.wrangler` (una sola BD).

La base remota se migra/seedea con `pnpm db:migrate:remote` y `pnpm db:seed:remote` (o automáticamente en CI).

## Desarrollo

```bash
pnpm --filter @tuhorafacil/web dev    # dashboard en http://localhost:5173
pnpm --filter @tuhorafacil/api dev    # API en http://localhost:8787
```

Verificación completa (lo mismo que corre el CI):

```bash
pnpm -r check && pnpm -r test && pnpm -r build
```

## Deploy

Cada push a `main` corre CI, migra la D1 remota y despliega ambos Workers (`.github/workflows/deploy.yml`). Requiere estos secrets en GitHub:

- `CLOUDFLARE_API_TOKEN` — token con permisos Workers Scripts:Edit y D1:Edit
- `CLOUDFLARE_ACCOUNT_ID`

Deploy manual: `pnpm --filter @tuhorafacil/api deploy` y `pnpm --filter @tuhorafacil/web deploy`.
