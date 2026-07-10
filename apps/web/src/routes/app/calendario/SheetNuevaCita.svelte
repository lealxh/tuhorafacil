<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import CamposCita from './CamposCita.svelte';
	import type { ComponentProps } from 'svelte';

	let {
		servicios,
		fecha,
		error,
		alGuardar,
		onBloquear
	}: {
		servicios: ComponentProps<typeof CamposCita>['servicios'];
		fecha: string;
		error: string | null;
		alGuardar: SubmitFunction;
		onBloquear: () => void;
	} = $props();
</script>

<h2 class="text-xl font-bold tracking-tight">Nueva cita</h2>
<form method="POST" action="?/crear" use:enhance={alGuardar} class="mt-4 flex flex-col gap-3">
	<label class="flex flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Cliente</span>
		<input
			name="clientaNombre"
			required
			placeholder="Valentina Pérez"
			class="input-base bg-white shadow-sm"
		/>
	</label>
	<label class="flex flex-col gap-1.5">
		<span class="text-ink-soft text-xs font-semibold">Teléfono (WhatsApp)</span>
		<input
			name="telefono"
			type="tel"
			required
			placeholder="+56 9 8765 4321"
			class="input-base bg-white shadow-sm"
		/>
	</label>
	<CamposCita {servicios} {fecha} horaInicio="12:00" />
	{#if error}<p class="form-error">{error}</p>{/if}
	<button type="submit" class="btn-primary mt-2 rounded-2xl px-4 py-3.5 text-[15px]">
		Guardar cita
	</button>
	<button type="button" onclick={onBloquear} class="text-ink-soft py-1 text-sm font-semibold">
		o bloquear un horario 🔒
	</button>
</form>
