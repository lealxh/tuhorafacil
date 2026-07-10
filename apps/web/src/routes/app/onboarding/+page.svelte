<script lang="ts">
	import { enhance } from '$app/forms';
	import HorariosEditor from '$lib/components/HorariosEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const RUBROS = ['Peluquería', 'Uñas', 'Estética'];

	let rubroElegido = $state(data.estilista?.rubro ?? 'Peluquería');

	const clp = (n: number) => '$' + n.toLocaleString('es-CL');

	const inputCls = 'input-base bg-surface';
	const btnPrimario = 'btn-primary rounded-field px-5 py-3 text-sm';

	// Hila el plan pagado elegido en la landing a través de los 4 pasos del wizard
	const q = (paso: number) =>
		`/app/onboarding?paso=${paso}${data.plan ? `&plan=${data.plan}` : ''}`;
</script>

<svelte:head><title>Configura tu negocio · tuhorafácil</title></svelte:head>

<main class="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 p-6">
	<p class="text-ink-faint text-xs font-bold tracking-wide uppercase">Paso {data.paso} de 4</p>

	{#if data.paso === 1}
		<h1 class="text-2xl font-bold tracking-tight">Cuéntanos de tu negocio</h1>
		<p class="text-ink-soft -mt-3 text-sm">Así arma tu página y tu agente sabe de qué hablar.</p>

		<form method="POST" action="?/negocio" use:enhance class="flex flex-col gap-4">
			<input type="hidden" name="plan" value={data.plan ?? ''} />
			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-semibold">Nombre del negocio</span>
				<input name="nombreNegocio" required placeholder="Salón Regias" class={inputCls} />
			</label>

			<div class="flex flex-col gap-1.5">
				<span class="text-sm font-semibold">Rubro</span>
				<div class="flex gap-2">
					{#each RUBROS as rubro (rubro)}
						<button
							type="button"
							onclick={() => (rubroElegido = rubro)}
							class="rounded-field flex-1 border px-3 py-2.5 text-sm font-semibold transition {rubroElegido ===
							rubro
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
				<input name="comuna" placeholder="Providencia" class={inputCls} />
			</label>

			{#if form?.error}<p class="form-error">
					{form.error}
				</p>{/if}
			<button type="submit" class={btnPrimario}>Continuar</button>
		</form>
	{:else if data.paso === 2}
		<h1 class="text-2xl font-bold tracking-tight">¿Qué servicios ofreces?</h1>
		<p class="text-ink-soft -mt-3 text-sm">Con precio y duración para que el agente agende bien.</p>

		<div class="flex flex-col gap-2.5">
			{#each data.servicios as servicio (servicio.id)}
				<div class="rounded-field flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{servicio.nombre}</p>
						<p class="text-ink-soft text-xs">{servicio.duracionMin} min · {clp(servicio.precio)}</p>
					</div>
					<form method="POST" action="?/eliminarServicio" use:enhance>
						<input type="hidden" name="id" value={servicio.id} />
						<button
							type="submit"
							aria-label="Eliminar {servicio.nombre}"
							class="text-ink-faint text-lg">✕</button
						>
					</form>
				</div>
			{:else}
				<p class="text-ink-soft rounded-field bg-blush px-4 py-3 text-sm">
					Agrega tu primer servicio 👇
				</p>
			{/each}
		</div>

		<form
			method="POST"
			action="?/agregarServicio"
			use:enhance
			class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm"
		>
			<input name="nombre" required placeholder="Corte + brushing" class={inputCls} />
			<div class="flex gap-3">
				<label class="flex min-w-0 flex-1 flex-col gap-1">
					<span class="text-ink-soft text-xs font-semibold">Duración (min)</span>
					<input
						name="duracionMin"
						type="number"
						required
						min="5"
						step="5"
						placeholder="60"
						class={inputCls}
					/>
				</label>
				<label class="flex min-w-0 flex-1 flex-col gap-1">
					<span class="text-ink-soft text-xs font-semibold">Precio (CLP)</span>
					<input
						name="precio"
						type="number"
						required
						min="0"
						step="500"
						placeholder="25000"
						class={inputCls}
					/>
				</label>
			</div>
			<button
				type="submit"
				class="rounded-field bg-blush text-blush-deep px-4 py-2.5 text-sm font-bold"
				>+ Agregar servicio</button
			>
		</form>

		{#if form?.error}<p class="form-error">
				{form.error}
			</p>{/if}

		<div class="mt-auto flex gap-3">
			<a
				href={q(1)}
				class="rounded-field border-line text-ink-soft flex-1 border bg-white px-4 py-3 text-center text-sm font-semibold"
				>Atrás</a
			>
			{#if data.servicios.length > 0}
				<a href={q(3)} class="{btnPrimario} flex-1 text-center">Continuar</a>
			{/if}
		</div>
	{:else if data.paso === 3}
		<h1 class="text-2xl font-bold tracking-tight">Tus horarios de atención</h1>
		<p class="text-ink-soft -mt-3 text-sm">El agente solo ofrece horas dentro de esto.</p>

		<form method="POST" action="?/guardarHorarios" use:enhance class="flex flex-1 flex-col gap-2.5">
			<input type="hidden" name="plan" value={data.plan ?? ''} />
			<HorariosEditor horarios={data.horarios} />

			{#if form?.error}<p class="form-error">
					{form.error}
				</p>{/if}

			<div class="mt-auto flex gap-3 pt-3">
				<a
					href={q(2)}
					class="rounded-field border-line text-ink-soft flex-1 border bg-white px-4 py-3 text-center text-sm font-semibold"
					>Atrás</a
				>
				<button type="submit" class="{btnPrimario} flex-1">Continuar</button>
			</div>
		</form>
	{:else}
		<h1 class="text-2xl font-bold tracking-tight">Conecta tu WhatsApp</h1>
		<p class="text-ink-soft -mt-3 text-sm">Tu agente responderá desde tu propio número.</p>

		<div class="rounded-card flex flex-col items-center gap-3 bg-white p-8 text-center shadow-sm">
			<div class="bg-blush flex h-14 w-14 items-center justify-center rounded-full text-2xl">
				💬
			</div>
			<p class="text-sm font-semibold">Disponible muy pronto</p>
			<p class="text-ink-soft text-sm">
				La conexión con WhatsApp se activa cuando Meta apruebe la plataforma. Tu agenda ya queda
				lista.
			</p>
		</div>

		<div class="mt-auto flex gap-3">
			<a
				href={q(3)}
				class="rounded-field border-line text-ink-soft flex-1 border bg-white px-4 py-3 text-center text-sm font-semibold"
				>Atrás</a
			>
			<a
				href={data.plan ? `/app/plan/checkout?plan=${data.plan}` : '/app'}
				class="{btnPrimario} flex-1 text-center"
			>
				{data.plan ? 'Continuar al pago' : 'Ir a mi agenda'}
			</a>
		</div>
	{/if}
</main>
