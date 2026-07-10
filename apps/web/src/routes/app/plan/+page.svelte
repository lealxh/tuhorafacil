<script lang="ts">
	import { clp, DESCRIPCIONES, NOMBRES } from '$lib/plan';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const tierActual = $derived(data.tiers.find((t) => t.id === data.tierActualId));
	const mensajes = $derived(data.consumo?.mensajesAgente ?? 0);
	const limite = $derived(tierActual?.limiteMensajesMes ?? null);
	const pct = $derived(limite ? Math.min(Math.round((mensajes / limite) * 100), 100) : 0);
	const cercaDelLimite = $derived(limite !== null && pct >= 80);
</script>

<svelte:head><title>Consumo · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6 lg:p-8">
	<div class="lg:hidden">
		<h1 class="text-2xl font-bold tracking-tight">Consumo y plan</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Tu plan actual y el uso del mes.</p>
	</div>

	{#if data.exito}
		<div
			class="rounded-card bg-success/12 text-success border-success/25 border px-4 py-3 text-sm font-semibold"
		>
			✓ Plan actualizado. Ya puedes usar las funciones de tu nuevo plan.
		</div>
	{/if}

	<div class="contents lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
		<div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
			<!-- Plan actual -->
			{#if tierActual}
				<div
					class="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3E2C2A] to-[#5A3F39] p-5 text-white shadow-[0_14px_28px_-12px_rgba(62,44,42,.5)]"
				>
					<div class="bg-primary-light/30 absolute -top-10 -right-5 h-36 w-36 rounded-full"></div>
					<p class="relative text-[11px] font-bold tracking-widest uppercase opacity-70">
						Plan actual
					</p>
					<p class="relative mt-1 text-2xl font-extrabold">{NOMBRES[tierActual.nombre]}</p>
					<p class="relative mt-0.5 text-[13px] opacity-85">
						CLP {clp(Number(tierActual.precioUsd))} / mes · {DESCRIPCIONES[tierActual.nombre]}
					</p>
				</div>
			{/if}

			<!-- Uso del mes -->
			<h2 class="text-ink-soft mt-1 text-xs font-bold tracking-wider uppercase">Uso de este mes</h2>

			{#if tierActual?.tieneAgente}
				<div class="rounded-card bg-white p-4 shadow-sm">
					<div class="flex items-baseline justify-between">
						<p class="text-sm font-semibold">Mensajes del agente</p>
						<p class="text-sm font-bold">
							{mensajes}<span class="text-ink-faint text-xs font-medium"
								>{limite ? ` / ${limite}` : ''}</span
							>
						</p>
					</div>
					{#if limite}
						<div class="bg-track mt-3 h-2.5 overflow-hidden rounded-md">
							<div
								class="h-full rounded-md {cercaDelLimite
									? 'bg-blush-deep'
									: 'from-primary to-primary-light bg-gradient-to-r'}"
								style="width:{pct}%"
							></div>
						</div>
						{#if cercaDelLimite}
							<p class="text-blush-deep mt-2.5 text-xs font-semibold">
								Te estás acercando al límite del mes: al llegar, tu agente se pausa. El plan Pro te
								da más margen.
							</p>
						{/if}
					{/if}
				</div>
			{/if}

			<div class="flex gap-2.5">
				<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
					<p class="text-success text-lg font-bold">{data.consumo?.citasCreadas ?? 0}</p>
					<p class="text-ink-soft text-[11px]">citas por tu agente</p>
				</div>
				<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
					<p class="text-lg font-bold">{data.consumo?.conversacionesMeta ?? 0}</p>
					<p class="text-ink-soft text-[11px]">recordatorios enviados</p>
				</div>
			</div>
		</div>

		<div class="contents lg:flex lg:flex-col lg:gap-4">
			<!-- Todos los planes -->
			<h2 class="text-ink-soft mt-1 text-xs font-bold tracking-wider uppercase lg:mt-0">
				Todos los planes
			</h2>
			<div class="flex flex-col gap-2.5">
				{#each data.tiers as tier (tier.id)}
					{@const actual = tier.id === data.tierActualId}
					<svelte:element
						this={actual ? 'div' : 'a'}
						href={actual ? undefined : `/app/plan/checkout?plan=${tier.nombre}`}
						class="rounded-card block p-4 {actual
							? 'bg-surface border-primary border-[1.5px]'
							: tier.nombre === 'pro'
								? 'bg-gradient-to-br from-[#FBE9E1] to-[#F7DED3] shadow-sm'
								: 'bg-white shadow-sm'}"
					>
						<div class="flex items-baseline justify-between">
							<div class="flex items-center gap-2">
								<p class="text-[15px] font-bold">{NOMBRES[tier.nombre]}</p>
								{#if actual}
									<span class="bg-blush text-primary rounded-full px-2 py-0.5 text-[9px] font-bold"
										>ACTUAL</span
									>
								{:else if tier.nombre === 'pro'}
									<span class="bg-primary rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
										>RECOMENDADO</span
									>
								{/if}
							</div>
							<p class="text-sm font-bold">{clp(Number(tier.precioUsd))}</p>
						</div>
						<p class="text-ink-soft mt-0.5 text-xs">{DESCRIPCIONES[tier.nombre]}</p>
						{#if !actual}
							<p class="text-blush-deep mt-2 text-xs font-bold">Cambiar a este plan ›</p>
						{/if}
					</svelte:element>
				{/each}
			</div>
		</div>
	</div>
</main>
