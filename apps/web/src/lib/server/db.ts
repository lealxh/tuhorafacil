import { createDb, eq, estilistas, type Db } from '@tuhorafacil/db';
import type { RequestEvent } from '@sveltejs/kit';

export function getDb(event: RequestEvent): Db {
	return createDb(event.platform!.env.DB);
}

export async function getEstilista(db: Db, userId: string) {
	return db.query.estilistas.findFirst({ where: eq(estilistas.userId, userId) });
}

export type Estilista = NonNullable<Awaited<ReturnType<typeof getEstilista>>>;
