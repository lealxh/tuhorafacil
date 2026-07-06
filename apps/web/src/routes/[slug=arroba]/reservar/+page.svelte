<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let horaSel: string | null = $state(null);
	$effect(() => {
		// Al cambiar fecha o servicio (nueva carga) se descarta la hora elegida
		void data.slots;
		horaSel = null;
	});

	const clp = (n: number) => '$' + n.toLocaleString('es-CL');
	const base = $derived(`/${page.params.slug}/reservar`);
	const linkCon = (params: Record<string, string>) => {
		const q = new URLSearchParams({ ...(data.servicio ? { servicio: data.servicio.id } : {}), fecha: data.fecha, ...params });
		return `${base}?${q}`;
	};
	const etiquetaDia = (fecha: string) => {
		const d = new Date(`${fecha}T12:00:00Z`);
		return {
			dow: new Intl.DateTimeFormat('es-CL', { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', ''),
			num: d.getUTCDate()
		};
	};
	const fechaLarga = (fecha: string) =>
		new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
			new Date(`${fecha}T12:00:00Z`)
		);
</script>

<svelte:head><title>Reservar · {data.negocio}</title></svelte:head>

<main class="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 p-6">
	{#if data.exito}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<div class="bg-success/15 text-success flex h-16 w-16 items-center justify-center rounded-full text-3xl">✓</div>
			<h1 class="text-2xl font-bold tracking-tight">¡Hora reservada!</h1>
			<div class="rounded-card w-full bg-white p-5 shadow-sm">
				<p class="text-sm font-semibold">{data.exito.servicio}</p>
				<p class="text-ink-soft mt-1 text-sm first-letter:capitalize">{fechaLarga(data.exito.fecha)} · {data.exito.hora} hrs</p>
				<p class="text-ink-soft mt-3 text-xs">{data.negocio} te espera. Si necesitas cambiarla, escríbele por WhatsApp.</p>
			</div>
			<a href="/{page.params.slug}" class="text-blush-deep text-sm font-bold">Volver a {data.negocio} ›</a>
		</div>
	{:else}
		<div>
			<a href="/{page.params.slug}" class="text-ink-soft text-xs font-semibold">‹ {data.negocio}</a>
			<h1 class="mt-1 text-2xl font-bold tracking-tight">Reserva tu hora</h1>
		</div>

		<!-- Paso 1: servicio -->
		<div>
			<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Servicio</h2>
			<div class="mt-2.5 flex flex-col gap-2">
				{#each data.servicios as servicio (servicio.id)}
					<a
						href="{base}?servicio={servicio.id}"
						class="rounded-field flex items-center gap-3 border px-4 py-3 {data.servicio?.id === servicio.id
							? 'border-primary bg-blush'
							: 'border-line bg-white'}"
					>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-semibold">{servicio.nombre}</span>
							<span class="text-ink-soft block text-xs">{servicio.duracionMin} min · {clp(servicio.precio)}</span>
						</span>
						{#if data.servicio?.id === servicio.id}<span class="text-primary text-lg">●</span>{/if}
					</a>
				{/each}
			</div>
		</div>

		{#if data.servicio}
			<!-- Paso 2: fecha -->
			<div>
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Fecha</h2>
				<div class="scrollbar-none -mx-6 mt-2.5 flex gap-2 overflow-x-auto px-6 pb-1">
					{#each data.dias as dia (dia.fecha)}
						{@const etiqueta = etiquetaDia(dia.fecha)}
						{#if dia.abierto}
							<a
								href={linkCon({ fecha: dia.fecha })}
								class="flex w-14 flex-none flex-col items-center gap-0.5 rounded-2xl border py-2.5 {data.fecha === dia.fecha
									? 'border-primary bg-blush'
									: 'border-line bg-white'}"
							>
								<span class="text-ink-soft text-[10px] font-semibold uppercase">{etiqueta.dow}</span>
								<span class="text-[15px] font-bold {data.fecha === dia.fecha ? 'text-primary' : ''}">{etiqueta.num}</span>
							</a>
						{:else}
							<span class="border-line flex w-14 flex-none flex-col items-center gap-0.5 rounded-2xl border bg-white py-2.5 opacity-35">
								<span class="text-ink-soft text-[10px] font-semibold uppercase">{etiqueta.dow}</span>
								<span class="text-[15px] font-bold">{etiqueta.num}</span>
							</span>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Paso 3: hora -->
			<div>
				<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Hora disponible</h2>
				{#if data.slots.length}
					<div class="mt-2.5 grid grid-cols-4 gap-2">
						{#each data.slots as slot (slot)}
							<button
								onclick={() => (horaSel = slot)}
								class="rounded-field border py-2.5 text-[13px] font-semibold {horaSel === slot
									? 'border-primary bg-primary text-white'
									: 'border-line bg-white'}"
							>
								{slot}
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-ink-soft rounded-field mt-2.5 bg-white px-4 py-3 text-sm">
						No quedan horas ese día 😔 Prueba con otra fecha.
					</p>
				{/if}
			</div>

			<!-- Paso 4: datos -->
			{#if horaSel}
				<form method="POST" action="?/reservar" use:enhance class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm">
					<p class="text-sm font-semibold">
						{data.servicio.nombre} · <span class="first-letter:capitalize">{fechaLarga(data.fecha)}</span> · {horaSel} hrs
					</p>
					<input type="hidden" name="servicio" value={data.servicio.id} />
					<input type="hidden" name="fecha" value={data.fecha} />
					<input type="hidden" name="hora" value={horaSel} />
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Tu nombre</span>
						<input name="nombre" required placeholder="Valentina Pérez" class="rounded-field border-line focus:border-primary bg-surface border px-4 py-2.5 text-sm" />
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Tu teléfono (WhatsApp)</span>
						<input name="telefono" type="tel" required placeholder="+56 9 8765 4321" class="rounded-field border-line focus:border-primary bg-surface border px-4 py-2.5 text-sm" />
					</label>
					{#if form?.error}<p class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm">{form.error}</p>{/if}
					<button
						type="submit"
						class="rounded-field from-primary to-primary-light bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
					>
						Confirmar reserva
					</button>
				</form>
			{/if}
		{/if}
	{/if}
</main>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
