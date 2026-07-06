import { createDb, eq, estilistas, user, type Db } from '@tuhorafacil/db';
import type { RequestEvent } from '@sveltejs/kit';

export function getDb(event: RequestEvent): Db {
	return createDb(event.platform!.env.DB);
}

export async function getEstilista(db: Db, userId: string) {
	return db.query.estilistas.findFirst({ where: eq(estilistas.userId, userId) });
}

// `role` es additionalField de better-auth y no viaja en locals.user, así que se re-consulta
export async function esAdmin(db: Db, userId: string): Promise<boolean> {
	const fila = await db.query.user.findFirst({
		where: eq(user.id, userId),
		columns: { role: true }
	});
	return fila?.role === 'admin';
}

export type Estilista = NonNullable<Awaited<ReturnType<typeof getEstilista>>>;
