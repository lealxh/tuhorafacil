<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let texto = $state('');
	let enviando = $state(false);
	let hilo: HTMLDivElement | undefined = $state();

	// Auto-scroll al final cuando llegan mensajes nuevos
	$effect(() => {
		data.mensajes.length;
		hilo?.scrollTo({ top: hilo.scrollHeight });
	});
</script>

<svelte:head><title>Probar agente · tuhorafácil</title></svelte:head>

<main class="flex h-full flex-col p-6 lg:p-8">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Probar agente</h1>
			<p class="text-ink-soft mt-0.5 text-sm">
				Conversa con tu agente como si fueras una clienta. Sin WhatsApp, solo para probar.
			</p>
		</div>
		<form method="POST" action="?/reset" use:enhance>
			<button
				type="submit"
				class="rounded-field border-line text-ink-soft border bg-white px-3 py-2 text-xs font-bold"
			>
				Reiniciar
			</button>
		</form>
	</div>

	<div bind:this={hilo} class="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
		{#each data.mensajes as mensaje, i (i)}
			<div
				class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap {mensaje.rol ===
				'clienta'
					? 'bg-blush text-ink self-end'
					: 'self-start bg-white shadow-sm'}"
			>
				{mensaje.contenido}
			</div>
		{:else}
			<p class="text-ink-soft m-auto max-w-xs text-center text-sm">
				Escríbele algo como <strong>«Hola, quiero agendar un corte para mañana»</strong> y mira cómo responde.
			</p>
		{/each}
		{#if enviando}
			<div class="self-start rounded-2xl bg-white px-3.5 py-2 text-sm shadow-sm">
				<span class="text-ink-faint">escribiendo…</span>
			</div>
		{/if}
	</div>

	{#if form && 'error' in form && form.error}
		<p class="text-blush-deep mt-2 text-xs font-semibold">{form.error}</p>
	{/if}

	<form
		method="POST"
		action="?/enviar"
		class="mt-3 flex items-end gap-2"
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				await update();
				enviando = false;
				texto = '';
			};
		}}
	>
		<textarea
			name="texto"
			bind:value={texto}
			rows="1"
			placeholder="Escribe como clienta…"
			class="rounded-field border-line focus:border-primary bg-surface flex-1 resize-none border px-3.5 py-2.5 text-sm"
		></textarea>
		<button
			type="submit"
			disabled={enviando || !texto.trim()}
			class="rounded-field from-primary to-primary-light bg-gradient-to-br px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)] disabled:opacity-50"
		>
			Enviar
		</button>
	</form>
</main>
