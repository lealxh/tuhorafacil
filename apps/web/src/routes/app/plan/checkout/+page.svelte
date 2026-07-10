<script lang="ts">
	import { enhance } from '$app/forms';
	import { clp, DESCRIPCIONES, NOMBRES } from '$lib/plan';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let pagando = $state(false);
	const precioLegible = $derived('$' + data.montoClp.toLocaleString('es-CL'));
</script>

<svelte:head><title>Pago · tuhorafácil</title></svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-4 p-6 lg:p-8">
	<a href="/app/plan" class="text-ink-soft text-sm font-semibold">‹ Volver a planes</a>

	<div
		class="rounded-card bg-amber-100/60 border-amber-300/50 border px-4 py-2.5 text-xs font-semibold text-amber-800"
	>
		Pago simulado: no se cobra nada. Sirve para probar el cambio de plan.
	</div>

	<!-- Resumen del plan -->
	<div class="rounded-card bg-white p-5 shadow-sm">
		<p class="text-ink-soft text-[11px] font-bold tracking-widest uppercase">Vas a contratar</p>
		<div class="mt-1 flex items-baseline justify-between">
			<p class="text-2xl font-extrabold">{NOMBRES[data.tier.nombre]}</p>
			<p class="text-lg font-bold">
				{precioLegible}<span class="text-ink-faint text-xs font-medium"> / mes</span>
			</p>
		</div>
		<p class="text-ink-soft mt-0.5 text-sm">{DESCRIPCIONES[data.tier.nombre]}</p>
	</div>

	<!-- Tarjeta demo -->
	<form
		method="POST"
		action="?/pagar"
		class="rounded-card flex flex-col gap-3 bg-white p-5 shadow-sm"
		use:enhance={() => {
			pagando = true;
			return async ({ update }) => {
				await update();
				pagando = false;
			};
		}}
	>
		<input type="hidden" name="plan" value={data.tier.nombre} />
		<label class="flex flex-col gap-1.5">
			<span class="text-ink-soft text-xs font-bold tracking-wider uppercase">Número de tarjeta</span
			>
			<input
				value="4051 8856 0000 0008"
				readonly
				class="rounded-field border-line bg-surface border px-3.5 py-2.5 text-sm tracking-widest"
			/>
		</label>
		<div class="flex gap-3">
			<label class="flex flex-1 flex-col gap-1.5">
				<span class="text-ink-soft text-xs font-bold tracking-wider uppercase">Vence</span>
				<input
					value="12/28"
					readonly
					class="rounded-field border-line bg-surface border px-3.5 py-2.5 text-sm"
				/>
			</label>
			<label class="flex flex-1 flex-col gap-1.5">
				<span class="text-ink-soft text-xs font-bold tracking-wider uppercase">CVV</span>
				<input
					value="123"
					readonly
					class="rounded-field border-line bg-surface border px-3.5 py-2.5 text-sm"
				/>
			</label>
		</div>

		{#if form && 'error' in form && form.error}
			<p class="text-blush-deep text-xs font-semibold">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={pagando}
			class="btn-primary rounded-field mt-1 px-4 py-3 text-sm disabled:opacity-50"
		>
			{pagando ? 'Procesando…' : `Pagar ${precioLegible}`}
		</button>
	</form>
</main>
