<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const slug = $derived(data.estilista?.slugPublico ?? '');
	const url = $derived(`${page.url.origin}/@${slug}`);
	let copiado = $state(false);

	async function copiar() {
		await navigator.clipboard.writeText(url);
		copiado = true;
		setTimeout(() => (copiado = false), 2000);
	}
</script>

<svelte:head><title>Mi página · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Mi página</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Tu link de reservas para la bio de Instagram.</p>
	</div>

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

	<a
		href="/@{slug}"
		target="_blank"
		class="rounded-field text-blush-deep block bg-white px-4 py-3 text-center text-sm font-semibold shadow-sm"
	>
		Ver mi página como la ven tus clientas ›
	</a>

	<div class="rounded-card bg-white p-5 shadow-sm">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Qué muestra tu página</h2>
		<ul class="text-ink-soft mt-3 flex flex-col gap-2 text-sm">
			<li>· El nombre de tu negocio, rubro y comuna</li>
			<li>· Tus <a href="/app/servicios" class="text-blush-deep font-semibold">servicios activos</a> con precio y duración</li>
			<li>· Tus <a href="/app/horarios" class="text-blush-deep font-semibold">horarios</a> de atención</li>
			<li>· Reserva directa con tus horas realmente disponibles</li>
		</ul>
		<p class="text-ink-faint mt-3 text-xs">Foto y bio personalizada: muy pronto.</p>
	</div>
</main>
