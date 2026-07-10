<script lang="ts">
	const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
	const ORDEN = [1, 2, 3, 4, 5, 6, 0];

	let { horarios }: { horarios: { diaSemana: number; horaInicio: string; horaFin: string }[] } =
		$props();

	const horarioDe = (dia: number) => horarios.find((h) => h.diaSemana === dia);
	// Sin datos aún: propone lunes a viernes abierto
	const abiertoDefault = (dia: number) =>
		horarios.length === 0 ? dia >= 1 && dia <= 5 : horarioDe(dia) !== undefined;
</script>

{#each ORDEN as dia (dia)}
	<div class="rounded-field flex items-center gap-3 bg-white px-4 py-2 shadow-sm">
		<label class="flex w-28 flex-none items-center gap-2.5">
			<input
				type="checkbox"
				name="abierto-{dia}"
				checked={abiertoDefault(dia)}
				class="text-primary focus:ring-primary/30 rounded"
			/>
			<span class="text-sm font-semibold">{DIAS[dia]}</span>
		</label>
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<input
				type="time"
				name="inicio-{dia}"
				value={horarioDe(dia)?.horaInicio ?? '10:00'}
				class="input-base bg-surface min-w-0 flex-1 px-3 py-1.5"
			/>
			<span class="text-ink-faint flex-none text-xs">a</span>
			<input
				type="time"
				name="fin-{dia}"
				value={horarioDe(dia)?.horaFin ?? '19:00'}
				class="input-base bg-surface min-w-0 flex-1 px-3 py-1.5"
			/>
		</div>
	</div>
{/each}
