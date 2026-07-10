<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Editable; se re-siembra desde el server tras guardar/restaurar
	let texto = $state(data.plantilla);
	$effect(() => {
		texto = data.plantilla;
	});
</script>

<svelte:head><title>Prompt del agente · Admin</title></svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 lg:p-8">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h2 class="text-lg font-bold tracking-tight">System prompt del agente</h2>
			<p class="text-ink-soft mt-0.5 text-sm">
				Se aplica a <strong>todos</strong> los agentes. Los <code>{'{{tokens}}'}</code> se rellenan solos
				con los datos reales de cada negocio y clienta.
			</p>
		</div>
		<a href="/admin" class="text-blush-deep flex-none text-sm font-semibold">‹ Cuentas</a>
	</div>

	<div class="rounded-card bg-white p-3 text-xs shadow-sm">
		<p class="text-ink-soft font-semibold">Tokens disponibles:</p>
		<div class="mt-1.5 flex flex-wrap gap-1.5">
			{#each data.tokens as token (token)}
				<code class="bg-blush text-blush-deep rounded px-1.5 py-0.5">{`{{${token}}}`}</code>
			{/each}
		</div>
	</div>

	{#if !data.personalizado}
		<p class="text-ink-soft text-xs">
			Actualmente usa el prompt <strong>por defecto</strong> (sin cambios).
		</p>
	{:else}
		<p class="text-blush-deep text-xs font-semibold">
			Prompt personalizado activo (distinto del por defecto).
		</p>
	{/if}

	<form method="POST" action="?/guardar" use:enhance class="flex flex-col gap-3">
		<textarea
			name="plantilla"
			bind:value={texto}
			rows="26"
			spellcheck="false"
			class="input-base bg-surface rounded-card p-4 font-mono text-[13px] leading-relaxed"
		></textarea>

		{#if form && 'error' in form && form.error}<p class="text-blush-deep text-sm font-semibold">
				{form.error}
			</p>{/if}
		{#if form && 'guardado' in form}<p class="text-success text-sm font-semibold">
				Guardado ✓ — el agente ya usa este prompt.
			</p>{/if}
		{#if form && 'restaurado' in form}<p class="text-success text-sm font-semibold">
				Restaurado al prompt por defecto ✓
			</p>{/if}

		<div class="flex gap-2.5">
			<button type="submit" class="btn-primary rounded-field flex-1 px-4 py-3 text-sm">
				Guardar prompt
			</button>
			<button
				type="submit"
				formaction="?/restaurar"
				class="rounded-field border-line text-ink-soft flex-none border bg-white px-4 py-3 text-sm font-bold"
			>
				Restaurar por defecto
			</button>
		</div>
	</form>
</main>
