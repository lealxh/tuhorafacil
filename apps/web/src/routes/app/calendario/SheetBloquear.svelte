<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		fecha,
		error,
		alGuardar
	}: { fecha: string; error: string | null; alGuardar: SubmitFunction } = $props();
</script>

<h2 class="text-xl font-bold tracking-tight">Bloquear horario</h2>
<form method="POST" action="?/bloquear" use:enhance={alGuardar} class="mt-4 flex flex-col gap-3">
	<label class="flex flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Fecha</span>
		<input name="fecha" type="date" required value={fecha} class="input-base bg-white shadow-sm" />
	</label>
	<div class="flex gap-2.5">
		<label class="flex min-w-0 flex-1 flex-col gap-1.5">
			<span class="text-ink-soft text-xs font-semibold">Desde</span>
			<input name="desde" type="time" required value="13:00" class="input-base bg-white shadow-sm" />
		</label>
		<label class="flex min-w-0 flex-1 flex-col gap-1.5">
			<span class="text-ink-soft text-xs font-semibold">Hasta</span>
			<input name="hasta" type="time" required value="14:00" class="input-base bg-white shadow-sm" />
		</label>
	</div>
	<label class="flex flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Motivo (opcional)</span>
		<input name="motivo" placeholder="Almuerzo" class="input-base bg-white shadow-sm" />
	</label>
	{#if error}<p class="form-error">{error}</p>{/if}
	<button
		type="submit"
		class="bg-ink mt-2 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-white transition active:scale-[.98]"
	>
		Bloquear
	</button>
</form>
