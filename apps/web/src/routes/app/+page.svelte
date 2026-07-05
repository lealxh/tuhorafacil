<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const confirmadas = $derived(data.citasHoy.filter((c) => c.estado === 'confirmada').length);
	const estimado = $derived(data.citasHoy.reduce((suma, c) => suma + c.precio, 0));
	const clp = (n: number) =>
		n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString('es-CL')}`;
	const fechaBonita = $derived(
		new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
			new Date(`${data.hoy}T12:00:00Z`)
		)
	);
</script>

<svelte:head><title>Hoy · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Hola, {data.user.name} 👋</h1>
			<p class="text-ink-soft mt-0.5 text-sm first-letter:capitalize">
				{fechaBonita} · {data.citasHoy.length}
				{data.citasHoy.length === 1 ? 'cita' : 'citas'} hoy
			</p>
		</div>
		<div
			class="from-primary to-primary-light flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white"
		>
			{data.user.name.charAt(0).toUpperCase()}
		</div>
	</div>

	<div class="flex gap-2.5">
		<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
			<p class="text-primary text-xl font-bold">{confirmadas}</p>
			<p class="text-ink-soft text-[11px]">confirmadas</p>
		</div>
		<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
			<p class="text-xl font-bold">{data.citasHoy.length - confirmadas}</p>
			<p class="text-ink-soft text-[11px]">otras</p>
		</div>
		<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
			<p class="text-xl font-bold">{clp(estimado)}</p>
			<p class="text-ink-soft text-[11px]">estimado</p>
		</div>
	</div>

	<div class="mt-2 flex items-baseline justify-between">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Tu día</h2>
		<a href="/app/calendario" class="text-primary text-xs font-semibold">Ver calendario ›</a>
	</div>

	<div class="flex flex-col gap-2.5">
		{#each data.citasHoy as cita (cita.id)}
			<div class="rounded-card flex items-center gap-3.5 bg-white px-4 py-3.5 shadow-sm">
				<div class="min-w-11 text-center">
					<p class="text-primary text-[15px] font-bold">{cita.horaInicio}</p>
					<p class="text-ink-faint text-[10px]">{cita.duracionMin} min</p>
				</div>
				<div class="bg-line h-8 w-px"></div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold">{cita.clienta}</p>
					<p class="text-ink-soft truncate text-xs">{cita.servicio}</p>
				</div>
				{#if cita.origen === 'agente'}
					<span class="bg-blush text-primary rounded-full px-2 py-1 text-[10px] font-bold">✨ agente</span>
				{:else if cita.estado === 'confirmada'}
					<span class="bg-success h-2 w-2 rounded-full"></span>
				{/if}
			</div>
		{:else}
			<div class="rounded-card bg-white p-6 text-center shadow-sm">
				<p class="text-sm font-semibold">Sin citas para hoy</p>
				<p class="text-ink-soft mt-1 text-sm">Cuando agendes (o tu agente lo haga), aparecen aquí.</p>
			</div>
		{/each}
	</div>

	<div class="mt-2 flex flex-col gap-2.5">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Tu negocio</h2>
		<a href="/app/servicios" class="rounded-card flex items-center justify-between bg-white px-4 py-3.5 text-sm font-semibold shadow-sm">
			Servicios <span class="text-ink-faint">›</span>
		</a>
		<a href="/app/horarios" class="rounded-card flex items-center justify-between bg-white px-4 py-3.5 text-sm font-semibold shadow-sm">
			Horarios <span class="text-ink-faint">›</span>
		</a>
	</div>

	<form method="POST" action="?/logout" use:enhance class="mt-4">
		<button type="submit" class="rounded-field border-line text-ink-soft w-full border bg-white px-4 py-3 text-sm font-semibold">
			Cerrar sesión
		</button>
	</form>
</main>
