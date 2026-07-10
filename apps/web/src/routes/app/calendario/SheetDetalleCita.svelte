<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import CamposCita from './CamposCita.svelte';
	import type { ComponentProps } from 'svelte';

	interface Cita {
		id: string;
		clienta: string;
		servicio: string;
		servicioId: string;
		fecha: string;
		horaInicio: string;
		horaFin: string;
		origen: string;
	}

	let {
		cita,
		servicios,
		error,
		alGuardar
	}: {
		cita: Cita;
		servicios: ComponentProps<typeof CamposCita>['servicios'];
		error: string | null;
		alGuardar: SubmitFunction;
	} = $props();

	let editando = $state(false);
</script>

<h2 class="text-xl font-bold tracking-tight">{cita.clienta}</h2>
<p class="text-ink-soft mt-1 text-sm">
	{cita.servicio} · {cita.horaInicio}–{cita.horaFin}
	{#if cita.origen === 'agente'}<span
			class="bg-blush text-primary ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
			>✨ agente</span
		>{/if}
</p>
{#if editando}
	<form method="POST" action="?/editar" use:enhance={alGuardar} class="mt-4 flex flex-col gap-3">
		<input type="hidden" name="id" value={cita.id} />
		<CamposCita
			{servicios}
			fecha={cita.fecha}
			horaInicio={cita.horaInicio}
			servicioId={cita.servicioId}
		/>
		{#if error}<p class="form-error">{error}</p>{/if}
		<button type="submit" class="btn-primary mt-2 rounded-2xl px-4 py-3.5 text-[15px]">
			Guardar cambios
		</button>
		<button
			type="button"
			onclick={() => (editando = false)}
			class="text-ink-soft py-1 text-sm font-semibold"
		>
			Cancelar
		</button>
	</form>
{:else}
	<div class="mt-5 flex gap-2.5">
		<button
			type="button"
			onclick={() => (editando = true)}
			class="btn-primary rounded-field flex-1 px-4 py-3 text-sm"
		>
			Editar
		</button>
		<form method="POST" action="?/cancelar" use:enhance={alGuardar} class="flex-1">
			<input type="hidden" name="id" value={cita.id} />
			<button
				type="submit"
				class="rounded-field border-line text-blush-deep w-full border bg-white px-4 py-3 text-sm font-bold"
			>
				Cancelar cita
			</button>
		</form>
	</div>
{/if}
