<script lang="ts">
	interface Servicio {
		id: string;
		nombre: string;
		duracionMin: number;
	}

	let {
		servicios,
		fecha,
		horaInicio,
		servicioId
	}: { servicios: Servicio[]; fecha: string; horaInicio: string; servicioId?: string } = $props();
</script>

<label class="flex flex-col gap-1.5">
	<span class="text-ink-soft text-xs font-semibold">Servicio</span>
	<select name="servicioId" required class="input-base bg-white shadow-sm">
		{#each servicios as servicio (servicio.id)}
			<option value={servicio.id} selected={servicio.id === servicioId}
				>{servicio.nombre} · {servicio.duracionMin} min</option
			>
		{/each}
	</select>
</label>
<div class="flex gap-2.5">
	<label class="flex min-w-0 flex-1 flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Fecha</span>
		<input name="fecha" type="date" required value={fecha} class="input-base bg-white shadow-sm" />
	</label>
	<label class="flex min-w-0 flex-1 flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Hora</span>
		<input
			name="horaInicio"
			type="time"
			required
			value={horaInicio}
			step="900"
			class="input-base bg-white shadow-sm"
		/>
	</label>
</div>
