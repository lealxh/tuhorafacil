<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let texto = $state('');
	let enviando = $state(false);
	// Mensaje mostrado optimistamente mientras el server procesa (como WhatsApp)
	let pendiente: string | null = $state(null);
	let hilo: HTMLDivElement | undefined = $state();

	// Auto-scroll al final cuando llegan mensajes nuevos
	$effect(() => {
		void [data.mensajes.length, pendiente, enviando];
		hilo?.scrollTo({ top: hilo.scrollHeight });
	});

	function enviarConEnter(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
		if (e.key === 'Enter' && !e.shiftKey && texto.trim() && !enviando) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	}
</script>

<svelte:head><title>Probar agente · tuhorafácil</title></svelte:head>

<!-- Altura anclada al viewport: el hilo scrollea por dentro y el composer queda siempre
     visible. Móvil: 6rem compensa el pb-24 del layout (tabs inferiores); dvh sigue al
     teclado. Desktop: 170px compensa header del layout + paddings. -->
<main
	class="mx-auto flex h-[calc(100dvh-6rem)] w-full flex-col px-5 pt-4 lg:h-[calc(100vh-170px)] lg:max-w-2xl lg:px-6 lg:pt-6"
>
	<div class="flex items-start justify-between gap-3">
		<div class="lg:hidden">
			<a href="/app/agente" class="text-ink-soft text-xs font-semibold">‹ Mi agente</a>
			<h1 class="mt-1 text-xl font-bold tracking-tight">Probar agente</h1>
			<p class="text-ink-soft mt-0.5 text-xs">Escríbele como si fueras una clienta.</p>
		</div>
		<form method="POST" action="?/reset" use:enhance class="lg:ml-auto">
			<button
				type="submit"
				class="rounded-field border-line text-ink-soft border bg-white px-3 py-2 text-xs font-bold"
			>
				Reiniciar
			</button>
		</form>
	</div>

	<div
		bind:this={hilo}
		class="hilo mt-3 flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pb-2 lg:pr-2"
	>
		{#each data.mensajes as mensaje, i (i)}
			<div
				class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap lg:max-w-[70%] {mensaje.rol ===
				'clienta'
					? 'bg-blush text-ink self-end'
					: 'self-start bg-white shadow-sm'}"
			>
				{mensaje.contenido}
			</div>
		{:else}
			{#if !pendiente}
				<p class="text-ink-soft m-auto max-w-xs text-center text-sm">
					Escríbele algo como <strong>«Hola, quiero agendar un corte para mañana»</strong> y mira cómo
					responde.
				</p>
			{/if}
		{/each}
		{#if pendiente}
			<!-- Optimista: la burbuja aparece al instante; el server la confirma con el update -->
			<div
				class="bg-blush text-ink max-w-[85%] self-end rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap lg:max-w-[70%]"
			>
				{pendiente}
			</div>
		{/if}
		{#if enviando}
			<div class="self-start rounded-2xl bg-white px-3.5 py-2 text-sm shadow-sm">
				<span class="text-ink-faint">escribiendo…</span>
			</div>
		{/if}
	</div>

	{#if form && 'error' in form && form.error}
		<p class="text-blush-deep mt-1 text-xs font-semibold">{form.error}</p>
	{/if}

	<form
		method="POST"
		action="?/enviar"
		class="mt-2 flex items-end gap-2 pb-3 lg:pb-0"
		use:enhance={() => {
			// enhance ya capturó el FormData: se puede vaciar el textarea al tiro
			pendiente = texto.trim();
			texto = '';
			enviando = true;
			return async ({ result, update }) => {
				await update();
				enviando = false;
				// Si falló, no perder lo escrito: vuelve al textarea para reintentar
				if (result.type !== 'success' && pendiente) texto = pendiente;
				pendiente = null;
			};
		}}
	>
		<!-- text-[16px] en móvil: con menos de 16px iOS hace zoom automático al enfocar -->
		<textarea
			name="texto"
			bind:value={texto}
			rows="1"
			placeholder="Escribe como clienta…"
			enterkeyhint="send"
			onkeydown={enviarConEnter}
			class="input-base flex-1 resize-none bg-white px-3.5 py-2.5 text-[16px] shadow-sm lg:text-sm"
		></textarea>
		<button
			type="submit"
			disabled={enviando || !texto.trim()}
			class="btn-primary rounded-field px-4 py-2.5 text-sm disabled:opacity-50"
		>
			Enviar
		</button>
	</form>
</main>

<style>
	/* Scrollbar discreta acorde al tema (Chrome/Firefox/Edge) */
	.hilo {
		scrollbar-width: thin;
		scrollbar-color: var(--color-line) transparent;
	}
	/* Safari, que aún no soporta scrollbar-color */
	.hilo::-webkit-scrollbar {
		width: 6px;
	}
	.hilo::-webkit-scrollbar-thumb {
		background: var(--color-line);
		border-radius: 3px;
	}
	.hilo::-webkit-scrollbar-track {
		background: transparent;
	}
</style>
