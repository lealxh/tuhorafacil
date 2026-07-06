<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import HorariosEditor from '$lib/components/HorariosEditor.svelte';
	import ServiciosEditor from '$lib/components/ServiciosEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const slug = $derived(data.estilista?.slugPublico ?? '');
	const url = $derived(`${page.url.origin}/@${slug}`);
	let copiado = $state(false);
	let tab: 'pagina' | 'servicios' | 'horarios' = $state('pagina');
	let rubroElegido = $state(data.estilista?.rubro ?? 'Peluquería');

	const RUBROS = ['Peluquería', 'Uñas', 'Estética'];
	const TABS = [
		['pagina', 'Página'],
		['servicios', 'Servicios'],
		['horarios', 'Horarios']
	] as const;
	const inputCls =
		'rounded-field border-line focus:border-primary focus:ring-primary/30 border bg-surface px-4 py-2.5 text-sm';

	async function copiar() {
		await navigator.clipboard.writeText(url);
		copiado = true;
		setTimeout(() => (copiado = false), 2000);
	}
</script>

<svelte:head><title>Mi página · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6 lg:p-8">
	<div class="lg:hidden">
		<h1 class="text-2xl font-bold tracking-tight">Mi página</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Todo lo que ven tus clientas, editable aquí.</p>
	</div>

	<div class="contents lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
	<div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">

	<!-- Link público -->
	<div class="rounded-card flex items-center gap-3 bg-white px-4 py-3.5 shadow-sm">
		<p class="text-ink-soft min-w-0 flex-1 truncate text-sm">
			tuhorafacil.cl/<span class="text-ink font-bold">@{slug}</span>
		</p>
		<button
			onclick={copiar}
			class="rounded-field from-primary to-primary-light flex-none bg-gradient-to-br px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgba(217,127,106,.7)]"
		>
			{copiado ? 'Copiado ✓' : 'Copiar link'}
		</button>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 rounded-2xl bg-[#F3E4DE] p-1">
		{#each TABS as [valor, etiqueta] (valor)}
			<button
				onclick={() => (tab = valor)}
				class="flex-1 rounded-[13px] py-2 text-center text-[13px] font-semibold {tab === valor
					? 'text-ink bg-white shadow-sm'
					: 'text-ink-soft'}"
			>
				{etiqueta}
			</button>
		{/each}
	</div>

	{#if tab === 'pagina'}
		<form method="POST" action="?/negocio" use:enhance class="rounded-card flex flex-col gap-4 bg-white p-4 shadow-sm">
			<div>
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Foto y bio</h2>
				<div class="mt-3 flex items-center gap-3.5">
					<div
						class="border-line flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed bg-[#F1E2DC] text-2xl"
					>
						📷
					</div>
					<span class="rounded-field bg-blush text-blush-deep/60 px-4 py-2.5 text-xs font-bold">Cambiar foto · muy pronto</span>
				</div>
				<textarea
					name="bio"
					rows="3"
					maxlength="300"
					placeholder="Peluquería y color en Providencia 🌿 Especialista en balayage. Reserva tu hora aquí abajo 👇"
					class="{inputCls} mt-3 w-full">{data.estilista?.bio ?? ''}</textarea>
			</div>

			<div class="flex flex-col gap-3">
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Datos del negocio</h2>
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-semibold">Nombre del negocio</span>
					<input name="nombreNegocio" required value={data.estilista?.nombreNegocio ?? ''} class={inputCls} />
				</label>
				<div class="flex flex-col gap-1.5">
					<span class="text-sm font-semibold">Rubro</span>
					<div class="flex gap-2">
						{#each RUBROS as rubro (rubro)}
							<button
								type="button"
								onclick={() => (rubroElegido = rubro)}
								class="rounded-field flex-1 border px-3 py-2.5 text-sm font-semibold transition {rubroElegido === rubro
									? 'border-primary bg-blush text-blush-deep'
									: 'border-line text-ink-soft bg-white'}"
							>
								{rubro}
							</button>
						{/each}
					</div>
					<input type="hidden" name="rubro" value={rubroElegido} />
				</div>
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-semibold">Comuna</span>
					<input name="comuna" value={data.estilista?.comuna ?? ''} placeholder="Providencia" class={inputCls} />
				</label>
			</div>

			{#if form && 'error' in form && form.error}<p class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm">{form.error}</p>{/if}
			{#if form && 'guardado' in form}<p class="text-success text-xs font-semibold">Guardado ✓</p>{/if}
			<button
				type="submit"
				class="rounded-field from-primary to-primary-light bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
			>
				Guardar
			</button>
		</form>
	{:else if tab === 'servicios'}
		<div>
			<div class="mb-2.5 flex items-baseline justify-between">
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Servicios visibles</h2>
				<span class="text-ink-faint text-[11px]">Toca el switch para mostrar / ocultar</span>
			</div>
			<ServiciosEditor servicios={data.servicios} error={form && 'error' in form ? form.error : null} />
		</div>
	{:else}
		<form method="POST" action="?/horarios" use:enhance class="flex flex-col gap-2.5">
			<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Tus horarios de atención</h2>
			<HorariosEditor horarios={data.horarios} />
			{#if form && 'error' in form && form.error}<p class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm">{form.error}</p>{/if}
			{#if form && 'guardado' in form}<p class="text-success bg-success/10 rounded-field px-4 py-2.5 text-sm font-semibold">Horarios guardados ✓</p>{/if}
			<button
				type="submit"
				class="rounded-field from-primary to-primary-light mt-1 bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
			>
				Guardar horarios
			</button>
		</form>
	{/if}
	</div>

	<!-- Vista previa en vivo (mock desktop) -->
	<div class="hidden lg:block">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Vista previa en vivo</h2>
		<div class="mt-3 rounded-[28px] bg-[#141012] p-2 shadow-[0_20px_40px_-16px_rgba(80,40,30,.4)]">
			<iframe
				src="/@{slug}"
				title="Vista previa de tu página"
				class="h-[520px] w-full rounded-[22px] border-0 bg-white"
			></iframe>
		</div>
		<a
			href="/@{slug}"
			target="_blank"
			class="rounded-field text-blush-deep mt-3 block bg-white px-4 py-3 text-center text-sm font-semibold shadow-sm"
		>
			Abrir página completa ›
		</a>
	</div>
	</div>
</main>
