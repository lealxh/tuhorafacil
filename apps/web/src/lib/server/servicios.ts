import { and, eq, servicios, type Db } from '@tuhorafacil/db';

export function parseServicio(datos: FormData): { nombre: string; duracionMin: number; precio: number } | { error: string } {
	const nombre = String(datos.get('nombre') ?? '').trim();
	const duracionMin = Number(datos.get('duracionMin'));
	const precio = Number(datos.get('precio'));
	if (!nombre || !Number.isInteger(duracionMin) || duracionMin <= 0 || !Number.isInteger(precio) || precio < 0) {
		return { error: 'Revisa nombre, duración y precio del servicio.' };
	}
	return { nombre, duracionMin, precio };
}

export async function crearServicio(db: Db, estilistaId: string, datos: FormData) {
	const parsed = parseServicio(datos);
	if ('error' in parsed) return parsed;
	await db.insert(servicios).values({ estilistaId, ...parsed });
	return null;
}

export async function eliminarServicio(db: Db, estilistaId: string, id: string) {
	await db.delete(servicios).where(and(eq(servicios.id, id), eq(servicios.estilistaId, estilistaId)));
}

export async function toggleServicio(db: Db, estilistaId: string, id: string) {
	const actual = await db.query.servicios.findFirst({
		where: and(eq(servicios.id, id), eq(servicios.estilistaId, estilistaId))
	});
	if (!actual) return;
	await db.update(servicios).set({ activo: !actual.activo }).where(eq(servicios.id, actual.id));
}
