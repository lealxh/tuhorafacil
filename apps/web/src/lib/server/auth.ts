import { getRequestEvent } from '$app/server';
import { account, createDb, session, user, verification } from '@tuhorafacil/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

let instancia: ReturnType<typeof crearAuth> | undefined;

function crearAuth(env: Env) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(createDb(env.DB), {
			provider: 'sqlite',
			schema: { user, session, account, verification }
		}),
		emailAndPassword: { enabled: true },
		plugins: [sveltekitCookies(getRequestEvent)]
	});
}

/** Los bindings son estables por isolate; una sola instancia por Worker. */
export function getAuth(env: Env) {
	instancia ??= crearAuth(env);
	return instancia;
}

export type Auth = ReturnType<typeof getAuth>;
export type Sesion = Auth['$Infer']['Session'];
