import type { Sesion } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: Sesion['user'] | null;
			session: Sesion['session'] | null;
		}
		interface Platform {
			env: Env;
		}
	}
}

export {};
