<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
	const ORDEN = [1, 2, 3, 4, 5, 6, 0];
	const clp = (n: number) => '$' + n.toLocaleString('es-CL');
	const horarioDe = (dia: number) => data.horarios.find((h) => h.diaSemana === dia);
	const linkReserva = (servicioId?: string) =>
		`${page.params.slug}/reservar${servicioId ? `?servicio=${servicioId}` : ''}`;
</script>

<svelte:head>
	<title>{data.negocio.nombre} · Reserva tu hora</title>
	<meta name="description" content="Reserva tu hora en {data.negocio.nombre} en segundos." />
</svelte:head>

<main class="mx-auto flex min-h-screen w-full max-w-md flex-col pb-10">
	<div class="from-[#E7C9BC] to-[#DDB0A0] h-28 bg-gradient-to-br"></div>

	<div class="-mt-9 flex flex-col px-6">
		<div
			class="bg-blush flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border-[3px] border-white text-3xl shadow-[0_6px_16px_rgba(160,90,70,.2)]"
		>
			💇🏻‍♀️
		</div>
		<h1 class="mt-3 text-2xl font-extrabold tracking-tight">{data.negocio.nombre}</h1>
		{#if data.negocio.rubro || data.negocio.comuna}
			<p class="text-ink-soft mt-0.5 text-sm">
				{[data.negocio.rubro, data.negocio.comuna].filter(Boolean).join(' · ')}
			</p>
		{/if}

		<a
			href={linkReserva()}
			class="rounded-field from-primary to-primary-light mt-5 block bg-gradient-to-br px-4 py-3.5 text-center text-[15px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
		>
			Reservar una hora
		</a>

		<h2 class="text-ink-soft mt-7 text-xs font-bold tracking-wider uppercase">Servicios</h2>
		<div class="mt-3 flex flex-col gap-2.5">
			{#each data.servicios as servicio (servicio.id)}
				<div class="rounded-card border-line flex items-center gap-3 border bg-white px-4 py-3.5">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-semibold">{servicio.nombre}</p>
						<p class="text-ink-soft text-xs">{servicio.duracionMin} min · {clp(servicio.precio)}</p>
					</div>
					<a
						href={linkReserva(servicio.id)}
						class="rounded-field bg-blush text-blush-deep flex-none px-4 py-2 text-xs font-bold"
					>
						Reservar
					</a>
				</div>
			{:else}
				<p class="text-ink-soft rounded-card bg-white px-4 py-4 text-center text-sm">Aún no hay servicios publicados.</p>
			{/each}
		</div>

		<h2 class="text-ink-soft mt-7 text-xs font-bold tracking-wider uppercase">Horarios</h2>
		<div class="rounded-card border-line mt-3 flex flex-col gap-1.5 border bg-white px-4 py-3.5">
			{#each ORDEN as dia (dia)}
				{@const horario = horarioDe(dia)}
				<div class="flex items-center justify-between text-sm">
					<span class="font-medium">{DIAS[dia]}</span>
					<span class={horario ? 'text-ink-soft' : 'text-ink-faint'}>
						{horario ? `${horario.horaInicio} – ${horario.horaFin}` : 'Cerrado'}
					</span>
				</div>
			{/each}
		</div>

		<p class="text-ink-faint mt-8 text-center text-xs">
			Hecho con <a href="/" class="text-blush-deep font-semibold">tuhorafácil</a>
		</p>
	</div>
</main>
