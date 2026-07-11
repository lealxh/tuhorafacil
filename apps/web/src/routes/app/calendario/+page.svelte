<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { aMinutos, diaSemanaDe, sumarDias } from '@tuhorafacil/core';
	import Sheet from '$lib/components/Sheet.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';
	import SheetNuevaCita from './SheetNuevaCita.svelte';
	import SheetBloquear from './SheetBloquear.svelte';
	import SheetDetalleCita from './SheetDetalleCita.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const DOWS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
	const PX_POR_MIN = 54 / 60;

	let sheet: 'nueva' | 'bloquear' | null = $state(null);
	let citaSel: (typeof data.citas)[number] | null = $state(null);
	let bloqueoSel: (typeof data.bloqueos)[number] | null = $state(null);

	// Reactivo (no solo al montar): "+ Nueva cita" del header navega a ?nueva=1
	// estando ya en esta página, y eso no remonta el componente
	$effect(() => {
		if (page.url.searchParams.has('nueva')) sheet = 'nueva';
	});

	function cerrar() {
		sheet = null;
		citaSel = null;
		bloqueoSel = null;
	}

	const alGuardar: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') cerrar();
		};
	};

	const errorDe = (sheet: string) =>
		form && 'sheet' in form && form.sheet === sheet ? (form.error ?? null) : null;

	// Navegación ‹ › según vista
	function mover(delta: number): string {
		if (data.vista === 'dia') return sumarDias(data.fecha, delta);
		if (data.vista === 'semana') return sumarDias(data.fecha, delta * 7);
		const [y, m] = data.fecha.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 10);
	}
	const link = (vista: string, fecha: string) => `/app/calendario?vista=${vista}&fecha=${fecha}`;

	const tituloMes = $derived(
		new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
			.format(new Date(`${data.fecha}T12:00:00Z`))
			.replace(/^./, (c) => c.toUpperCase())
	);
	const tituloDia = $derived(
		new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', timeZone: 'UTC' })
			.format(new Date(`${data.fecha}T12:00:00Z`))
			.replace(/^./, (c) => c.toUpperCase())
	);

	// Ventana horaria de la vista día: desde/hasta según horarios configurados
	const horaDesde = $derived(
		data.horarios.length
			? Math.floor(Math.min(...data.horarios.map((h) => aMinutos(h.horaInicio))) / 60)
			: 9
	);
	const horaHasta = $derived(
		data.horarios.length
			? Math.ceil(Math.max(...data.horarios.map((h) => aMinutos(h.horaFin))) / 60)
			: 20
	);
	const altoDia = $derived((horaHasta - horaDesde) * 54);
	const topDe = (hora: string) => (aMinutos(hora) - horaDesde * 60) * PX_POR_MIN;

	// Semana
	const lunes = $derived(sumarDias(data.fecha, -((diaSemanaDe(data.fecha) + 6) % 7)));
	const diasSemana = $derived(
		Array.from({ length: 7 }, (_, i) => {
			const fecha = sumarDias(lunes, i);
			return {
				fecha,
				num: Number(fecha.slice(8)),
				citas: data.citas.filter((c) => c.fecha === fecha)
			};
		})
	);
	const citasAgente = $derived(data.citas.filter((c) => c.origen === 'agente').length);

	// Mes
	const celdasMes = $derived.by(() => {
		const [y, m] = data.fecha.split('-').map(Number);
		const primerDow = (diaSemanaDe(`${data.fecha.slice(0, 7)}-01`) + 6) % 7;
		const diasEnMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
		return [
			...Array.from({ length: primerDow }, () => null),
			...Array.from({ length: diasEnMes }, (_, i) => {
				const fecha = `${data.fecha.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`;
				return { fecha, dia: i + 1, cuenta: data.citas.filter((c) => c.fecha === fecha).length };
			})
		];
	});
</script>

<svelte:head><title>Calendario · tuhorafácil</title></svelte:head>

{#snippet pieSemana()}
	<p class="text-ink-soft text-center text-xs">
		{data.citas.length}
		{data.citas.length === 1 ? 'cita' : 'citas'} esta semana
		{#if citasAgente > 0}· <span class="text-primary font-semibold"
				>{citasAgente} por tu agente</span
			>{/if}
	</p>
{/snippet}

<main class="flex flex-col gap-4 py-6 lg:mx-auto lg:w-full lg:max-w-3xl lg:py-8">
	<div class="contents lg:flex lg:items-center lg:justify-between lg:px-6">
		<div class="flex items-center justify-between px-6 lg:gap-3 lg:px-0">
			<h1 class="text-[22px] font-bold tracking-tight lg:order-2 lg:text-[15px] lg:font-semibold">
				{tituloMes}
			</h1>
			<div class="flex gap-1.5 lg:order-1">
				<a
					href={link(data.vista, mover(-1))}
					aria-label="Anterior"
					class="text-ink-soft flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm lg:h-8 lg:w-8"
					>‹</a
				>
				<a
					href={link(data.vista, mover(1))}
					aria-label="Siguiente"
					class="text-ink-soft flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm lg:h-8 lg:w-8"
					>›</a
				>
			</div>
		</div>

		<div class="bg-track mx-6 flex gap-1 rounded-2xl p-1 lg:mx-0">
			{#each [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']] as [vista, etiqueta] (vista)}
				<a
					href={link(vista, data.fecha)}
					class="flex-1 rounded-[13px] py-2 text-center text-[13px] font-semibold lg:flex-none lg:px-5 {data.vista ===
					vista
						? 'text-ink bg-white shadow-sm'
						: 'text-ink-soft'}"
				>
					{etiqueta}
				</a>
			{/each}
		</div>
	</div>

	{#if data.vista === 'dia'}
		<div class="px-6 lg:rounded-[20px] lg:bg-white lg:p-6 lg:shadow-sm">
			<p class="text-ink-soft mb-3 text-[13px] font-semibold">
				{tituloDia} ·
				<span class="text-primary"
					>{data.citas.length} {data.citas.length === 1 ? 'cita' : 'citas'}</span
				>
			</p>
			<div class="relative" style="height:{altoDia}px">
				{#each Array.from({ length: horaHasta - horaDesde + 1 }, (_, i) => horaDesde + i) as hora (hora)}
					<div class="bg-line absolute inset-x-0 h-px" style="top:{(hora - horaDesde) * 54}px"></div>
					<p
						class="text-ink-faint absolute left-0 text-[10.5px] font-semibold"
						style="top:{(hora - horaDesde) * 54 - 6}px"
					>
						{String(hora).padStart(2, '0')}:00
					</p>
				{/each}
				{#each data.bloqueos as bloqueo (bloqueo.id)}
					<button
						onclick={() => (bloqueoSel = bloqueo)}
						class="border-ink-faint bg-line/80 absolute right-0.5 left-11 overflow-hidden rounded-xl border-l-[3px] px-3 py-1.5 text-left"
						style="top:{topDe(bloqueo.horaInicio)}px;height:{Math.max(
							(aMinutos(bloqueo.horaFin === '24:00' ? '23:59' : bloqueo.horaFin) -
								aMinutos(bloqueo.horaInicio)) *
								PX_POR_MIN,
							20
						)}px"
					>
						<p class="text-ink-soft text-[12px] font-semibold">
							🔒 {bloqueo.motivo ?? 'Bloqueado'}
						</p>
					</button>
				{/each}
				{#each data.citas as cita (cita.id)}
					<button
						onclick={() => (citaSel = cita)}
						class="border-primary bg-blush absolute right-0.5 left-11 overflow-hidden rounded-xl border-l-[3px] px-3 py-2 text-left"
						style="top:{topDe(cita.horaInicio)}px;height:{Math.max(
							(aMinutos(cita.horaFin) - aMinutos(cita.horaInicio)) * PX_POR_MIN,
							24
						)}px"
					>
						<p class="text-[13px] font-semibold">{cita.clienta}</p>
						<p class="text-ink-soft text-[11.5px]">
							{cita.servicio} · {cita.horaInicio}–{cita.horaFin}
						</p>
					</button>
				{/each}
			</div>
		</div>
	{:else if data.vista === 'semana'}
		<!-- Semana desktop: grilla horaria de 7 columnas (como el mock) -->
		<div class="mx-6 hidden rounded-[20px] bg-white p-5 shadow-sm lg:mx-0 lg:block">
			<div class="mb-3 flex pl-[52px]">
				{#each diasSemana as dia (dia.fecha)}
					<a href={link('dia', dia.fecha)} class="flex flex-1 flex-col items-center gap-1">
						<span class="text-ink-soft text-[11px] font-semibold"
							>{DOWS[(diaSemanaDe(dia.fecha) + 6) % 7]}</span
						>
						<span
							class="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13.5px] font-bold {dia.fecha ===
							data.hoy
								? 'from-primary to-primary-light bg-gradient-to-br text-white'
								: ''}"
						>
							{dia.num}
						</span>
					</a>
				{/each}
			</div>
			<div class="flex">
				<div class="relative w-[52px] flex-none" style="height:{altoDia}px">
					{#each Array.from({ length: horaHasta - horaDesde + 1 }, (_, i) => horaDesde + i) as hora (hora)}
						<p
							class="text-ink-faint absolute text-[10.5px] font-semibold"
							style="top:{(hora - horaDesde) * 54 - 6}px"
						>
							{String(hora).padStart(2, '0')}:00
						</p>
					{/each}
				</div>
				<div class="flex flex-1 gap-1.5">
					{#each diasSemana as dia (dia.fecha)}
						<div
							class="relative flex-1 rounded-[10px]"
							style="height:{altoDia}px;background:repeating-linear-gradient(var(--color-line) 0 1px,transparent 1px 54px)"
						>
							{#each dia.citas as cita (cita.id)}
								<button
									onclick={() => (citaSel = cita)}
									class="border-primary bg-blush absolute right-[3px] left-[3px] overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left"
									style="top:{topDe(cita.horaInicio)}px;height:{Math.max(
										(aMinutos(cita.horaFin) - aMinutos(cita.horaInicio)) * PX_POR_MIN,
										18
									)}px"
								>
									<p class="truncate text-[11px] font-semibold">{cita.clienta}</p>
								</button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
			<div class="mt-4">{@render pieSemana()}</div>
		</div>

		<div class="px-4 lg:hidden">
			<div class="flex gap-1.5">
				{#each diasSemana as dia (dia.fecha)}
					<a href={link('dia', dia.fecha)} class="flex flex-1 flex-col items-center gap-1.5">
						<span class="text-ink-soft text-[10.5px] font-semibold"
							>{DOWS[(diaSemanaDe(dia.fecha) + 6) % 7]}</span
						>
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold {dia.fecha ===
							data.hoy
								? 'from-primary to-primary-light bg-gradient-to-br text-white'
								: 'text-ink'}"
						>
							{dia.num}
						</span>
						<span class="mt-0.5 flex w-full flex-col gap-1">
							{#each dia.citas as cita (cita.id)}
								<span
									class="bg-blush border-primary block rounded-[5px] border-l-2"
									style="height:{Math.max(
										(aMinutos(cita.horaFin) - aMinutos(cita.horaInicio)) * 0.3,
										8
									)}px"
								></span>
							{/each}
						</span>
					</a>
				{/each}
			</div>
			<div class="mt-6">{@render pieSemana()}</div>
		</div>
	{:else}
		<div class="px-5 lg:rounded-[20px] lg:bg-white lg:p-6 lg:shadow-sm">
			<div class="mb-2 flex">
				{#each DOWS as dow, i (i)}
					<span class="text-ink-faint flex-1 text-center text-[10px] font-bold">{dow}</span>
				{/each}
			</div>
			<div class="grid grid-cols-7 gap-1">
				{#each celdasMes as celda, i (i)}
					{#if celda}
						<a
							href={link('dia', celda.fecha)}
							class="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[11px] lg:aspect-auto lg:min-h-[70px] lg:items-start lg:justify-start lg:p-2 {celda.fecha ===
							data.hoy
								? 'bg-blush'
								: 'bg-white/60'}"
						>
							<span
								class="text-xs {celda.fecha === data.hoy
									? 'text-primary font-bold'
									: 'font-semibold'}">{celda.dia}</span
							>
							<span class="flex gap-0.5">
								{#each Array.from({ length: Math.min(celda.cuenta, 3) }) as _, j (j)}
									<span class="bg-primary h-1 w-1 rounded-full"></span>
								{/each}
							</span>
						</a>
					{:else}
						<div></div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</main>

<!-- FAB nueva cita -->
<button
	onclick={() => (sheet = 'nueva')}
	aria-label="Nueva cita"
	class="btn-primary fixed right-5 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full pb-0.5 text-[28px] lg:hidden"
>
	+
</button>

{#if sheet || citaSel || bloqueoSel}
	<Sheet onCerrar={cerrar}>
		{#if sheet === 'nueva'}
			<SheetNuevaCita
				servicios={data.serviciosActivos}
				fecha={data.fecha}
				error={errorDe('crear')}
				{alGuardar}
				onBloquear={() => (sheet = 'bloquear')}
			/>
		{:else if sheet === 'bloquear'}
			<SheetBloquear fecha={data.fecha} error={errorDe('bloquear')} {alGuardar} />
		{:else if citaSel}
			<SheetDetalleCita
				cita={citaSel}
				servicios={data.serviciosActivos}
				error={errorDe('editar')}
				{alGuardar}
			/>
		{:else if bloqueoSel}
			<h2 class="text-xl font-bold tracking-tight">
				🔒 {bloqueoSel.motivo ?? 'Horario bloqueado'}
			</h2>
			<p class="text-ink-soft mt-1 text-sm">{bloqueoSel.horaInicio}–{bloqueoSel.horaFin}</p>
			<form method="POST" action="?/desbloquear" use:enhance={alGuardar} class="mt-5">
				<input type="hidden" name="id" value={bloqueoSel.id} />
				<button
					type="submit"
					class="rounded-field border-line text-ink-soft w-full border bg-white px-4 py-3 text-sm font-bold"
				>
					Quitar bloqueo
				</button>
			</form>
		{/if}
	</Sheet>
{/if}
