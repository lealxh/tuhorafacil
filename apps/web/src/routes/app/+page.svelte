<script lang="ts">
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

{#snippet statTiles(clase: string)}
	<div class="{clase} gap-2.5">
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
{/snippet}

<main class="flex flex-col gap-4 p-6 lg:p-8">
	<div class="flex items-start justify-between lg:hidden">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Hola, {data.user.name} 👋</h1>
			<p class="text-ink-soft mt-0.5 text-sm first-letter:capitalize">
				{fechaBonita} · {data.citasHoy.length}
				{data.citasHoy.length === 1 ? 'cita' : 'citas'} hoy
			</p>
		</div>
		<a
			href="/app/cuenta"
			aria-label="Tu cuenta"
			class="from-primary to-primary-light flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white"
		>
			{data.user.name.charAt(0).toUpperCase()}
		</a>
	</div>

	<div class="contents lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
	<div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
	{#if data.agente}
		<a
			href="/app/agente"
			class="rounded-card from-primary to-primary-light flex items-center gap-3.5 bg-gradient-to-br p-4 text-white shadow-[0_12px_24px_-10px_rgba(217,127,106,.6)]"
		>
			<span class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/20 text-lg">✨</span>
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-semibold">Tu agente estuvo trabajando</span>
				<span class="block text-xs text-white/90">
					Respondió {data.agente.mensajesHoy}
					{data.agente.mensajesHoy === 1 ? 'mensaje' : 'mensajes'} · agendó {data.agente.citasHoy}
					{data.agente.citasHoy === 1 ? 'cita' : 'citas'} hoy{data.agente.escaladas.length
						? ` · ${data.agente.escaladas.length} ${data.agente.escaladas.length === 1 ? 'escalado espera' : 'escalados esperan'} tu respuesta`
						: ''}
				</span>
			</span>
			<span class="text-lg opacity-85">›</span>
		</a>
	{/if}

	{@render statTiles('flex lg:hidden')}

	<div class="mt-2 flex items-baseline justify-between lg:mt-0">
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
	</div>

	<div class="contents lg:flex lg:flex-col lg:gap-4">
	{@render statTiles('hidden lg:flex')}

	{#if data.agente}
		<!-- Escalados (columna derecha del mock desktop) -->
		<div class="rounded-card hidden bg-white p-4 shadow-sm lg:block">
			<div class="flex items-center justify-between">
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Escalados</h2>
				{#if data.agente.escaladas.length}
					<span class="bg-primary-light rounded-full px-2 py-0.5 text-[11px] font-bold text-white">{data.agente.escaladas.length}</span>
				{/if}
			</div>
			<div class="mt-3 flex flex-col gap-2.5">
				{#each data.agente.escaladas as escalada (escalada.id)}
					<a
						href="/app/agente"
						class="bg-surface border-primary-light flex items-center gap-2.5 rounded-[14px] border-l-[3px] px-3 py-2.5"
					>
						<span
							class="from-primary to-primary-light flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white"
						>
							{escalada.clienta.charAt(0)}
						</span>
						<span class="min-w-0">
							<span class="block truncate text-[13px] font-semibold">{escalada.clienta}</span>
							<span class="text-ink-soft block truncate text-[11.5px]">{escalada.snippet}</span>
						</span>
					</a>
				{:else}
					<p class="text-ink-soft text-sm">Nada pendiente ✨</p>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-2 flex flex-col gap-2.5 lg:mt-0 lg:hidden">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Tu negocio</h2>
		<a href="/app/servicios" class="rounded-card flex items-center justify-between bg-white px-4 py-3.5 text-sm font-semibold shadow-sm">
			Servicios <span class="text-ink-faint">›</span>
		</a>
		<a href="/app/horarios" class="rounded-card flex items-center justify-between bg-white px-4 py-3.5 text-sm font-semibold shadow-sm">
			Horarios <span class="text-ink-faint">›</span>
		</a>
	</div>

	</div>
	</div>
</main>
