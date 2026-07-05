import { eq, horarios, type Db } from '@tuhorafacil/db';

/** Reemplaza el horario semanal completo desde el form del editor (abierto-N / inicio-N / fin-N). */
export async function guardarHorariosDesdeForm(db: Db, estilistaId: string, datos: FormData): Promise<{ error: string } | null> {
	const filas: { estilistaId: string; diaSemana: number; horaInicio: string; horaFin: string }[] = [];
	for (let dia = 0; dia <= 6; dia++) {
		if (datos.get(`abierto-${dia}`) !== 'on') continue;
		const horaInicio = String(datos.get(`inicio-${dia}`) ?? '');
		const horaFin = String(datos.get(`fin-${dia}`) ?? '');
		if (!/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFin) || horaInicio >= horaFin) {
			return { error: 'Revisa las horas: la apertura debe ser antes del cierre.' };
		}
		filas.push({ estilistaId, diaSemana: dia, horaInicio, horaFin });
	}
	if (filas.length === 0) return { error: 'Deja al menos un día abierto.' };

	await db.delete(horarios).where(eq(horarios.estilistaId, estilistaId));
	await db.insert(horarios).values(filas);
	return null;
}
