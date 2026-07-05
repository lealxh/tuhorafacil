<script lang="ts">
	import { enhance } from '$app/forms';
	import HorariosEditor from '$lib/components/HorariosEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Horarios · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6">
	<div>
		<a href="/app" class="text-ink-soft text-xs font-semibold">‹ Hoy</a>
		<h1 class="mt-1 text-2xl font-bold tracking-tight">Horarios</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Tu disponibilidad semanal.</p>
	</div>

	<form method="POST" action="?/guardar" use:enhance class="flex flex-col gap-2.5">
		<HorariosEditor horarios={data.horarios} />

		{#if form?.error}<p class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm">{form.error}</p>{/if}
		{#if form?.guardado}<p class="text-success bg-success/10 rounded-field px-4 py-2.5 text-sm font-semibold">Horarios guardados ✓</p>{/if}

		<button
			type="submit"
			class="rounded-field from-primary to-primary-light shadow-primary/40 mt-1 bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-lg transition active:scale-[.98]"
		>
			Guardar horarios
		</button>
	</form>
</main>
