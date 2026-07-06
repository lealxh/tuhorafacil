<script lang="ts">
	import { enhance } from '$app/forms';
	import { aMinutos, diaSemanaDe, sumarDias } from '@tuhorafacil/core';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const DOWS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
	const PX_POR_MIN = 54 / 60;

	import { page } from '$app/state';

	let sheet: 'nueva' | 'bloquear' | null = $state(
		page.url.searchParams.has('nueva') ? 'nueva' : null
	);
	let citaSel: (typeof data.citas)[number] | null = $state(null);
	let bloqueoSel: (typeof data.bloqueos)[number] | null = $state(null);
	let editando = $state(false);

	function cerrar() {
		sheet = null;
		citaSel = null;
		bloqueoSel = null;
		editando = false;
	}

	const alGuardar: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') cerrar();
		};
	};

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

	const inputSheet =
		'w-full rounded-field border-line focus:border-primary bg-white border px-4 py-3 text-sm shadow-sm';
</script>

<svelte:head><title>Calendario · tuhorafácil</title></svelte:head>

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

		<div class="mx-6 flex gap-1 rounded-2xl bg-[#F3E4DE] p-1 lg:mx-0">
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
					<div
						class="absolute inset-x-0 h-px bg-[#EFE0D9]"
						style="top:{(hora - horaDesde) * 54}px"
					></div>
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
						class="absolute right-0.5 left-11 overflow-hidden rounded-xl border-l-[3px] border-[#C0A69F] bg-[#F1E2DC]/80 px-3 py-1.5 text-left"
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
							style="height:{altoDia}px;background:repeating-linear-gradient(#F1E4DD 0 1px,transparent 1px 54px)"
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
			<p class="text-ink-soft mt-4 text-center text-xs">
				{data.citas.length}
				{data.citas.length === 1 ? 'cita' : 'citas'} esta semana
				{#if citasAgente > 0}· <span class="text-primary font-semibold"
						>{citasAgente} por tu agente</span
					>{/if}
			</p>
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
									class="bg-blush block rounded-[5px] border-l-2 border-primary"
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
			<p class="text-ink-soft mt-6 text-center text-xs">
				{data.citas.length}
				{data.citas.length === 1 ? 'cita' : 'citas'} esta semana
				{#if citasAgente > 0}· <span class="text-primary font-semibold"
						>{citasAgente} por tu agente</span
					>{/if}
			</p>
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
	class="from-primary to-primary-light fixed right-5 bottom-24 z-30 flex h-14 w-14 lg:hidden items-center justify-center rounded-full bg-gradient-to-br pb-0.5 text-[28px] text-white shadow-[0_14px_28px_-8px_rgba(217,127,106,.7)]"
>
	+
</button>

{#if sheet || citaSel || bloqueoSel}
	<div
		class="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center lg:p-6 bg-[rgba(40,20,18,.4)]"
		onclick={(e) => e.target === e.currentTarget && cerrar()}
		onkeydown={(e) => e.key === 'Escape' && cerrar()}
		role="presentation"
	>
		<div
			class="bg-background w-full rounded-t-[28px] px-6 pt-2.5 pb-8 lg:max-w-md lg:rounded-[28px] lg:pb-6"
		>
			<div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#E0C4B8]"></div>

			{#if sheet === 'nueva'}
				<h2 class="text-xl font-bold tracking-tight">Nueva cita</h2>
				<form
					method="POST"
					action="?/crear"
					use:enhance={alGuardar}
					class="mt-4 flex flex-col gap-3"
				>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Cliente</span>
						<input name="clientaNombre" required placeholder="Valentina Pérez" class={inputSheet} />
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Teléfono (WhatsApp)</span>
						<input
							name="telefono"
							type="tel"
							required
							placeholder="+56 9 8765 4321"
							class={inputSheet}
						/>
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Servicio</span>
						<select name="servicioId" required class={inputSheet}>
							{#each data.serviciosActivos as servicio (servicio.id)}
								<option value={servicio.id}>{servicio.nombre} · {servicio.duracionMin} min</option>
							{/each}
						</select>
					</label>
					<div class="flex gap-2.5">
						<label class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="text-ink-soft text-xs font-semibold">Fecha</span>
							<input name="fecha" type="date" required value={data.fecha} class={inputSheet} />
						</label>
						<label class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="text-ink-soft text-xs font-semibold">Hora</span>
							<input
								name="horaInicio"
								type="time"
								required
								value="12:00"
								step="900"
								class={inputSheet}
							/>
						</label>
					</div>
					{#if form && 'sheet' in form && form.sheet === 'crear'}<p
							class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm"
						>
							{form.error}
						</p>{/if}
					<button
						type="submit"
						class="rounded-2xl from-primary to-primary-light mt-2 bg-gradient-to-br px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
					>
						Guardar cita
					</button>
					<button
						type="button"
						onclick={() => (sheet = 'bloquear')}
						class="text-ink-soft py-1 text-sm font-semibold"
					>
						o bloquear un horario 🔒
					</button>
				</form>
			{:else if sheet === 'bloquear'}
				<h2 class="text-xl font-bold tracking-tight">Bloquear horario</h2>
				<form
					method="POST"
					action="?/bloquear"
					use:enhance={alGuardar}
					class="mt-4 flex flex-col gap-3"
				>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Fecha</span>
						<input name="fecha" type="date" required value={data.fecha} class={inputSheet} />
					</label>
					<div class="flex gap-2.5">
						<label class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="text-ink-soft text-xs font-semibold">Desde</span>
							<input name="desde" type="time" required value="13:00" class={inputSheet} />
						</label>
						<label class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="text-ink-soft text-xs font-semibold">Hasta</span>
							<input name="hasta" type="time" required value="14:00" class={inputSheet} />
						</label>
					</div>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-semibold">Motivo (opcional)</span>
						<input name="motivo" placeholder="Almuerzo" class={inputSheet} />
					</label>
					{#if form && 'sheet' in form && form.sheet === 'bloquear'}<p
							class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm"
						>
							{form.error}
						</p>{/if}
					<button
						type="submit"
						class="rounded-2xl bg-ink mt-2 px-4 py-3.5 text-[15px] font-bold text-white transition active:scale-[.98]"
					>
						Bloquear
					</button>
				</form>
			{:else if citaSel}
				<h2 class="text-xl font-bold tracking-tight">{citaSel.clienta}</h2>
				<p class="text-ink-soft mt-1 text-sm">
					{citaSel.servicio} · {citaSel.horaInicio}–{citaSel.horaFin}
					{#if citaSel.origen === 'agente'}<span
							class="bg-blush text-primary ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
							>✨ agente</span
						>{/if}
				</p>
				{#if editando}
					<form
						method="POST"
						action="?/editar"
						use:enhance={alGuardar}
						class="mt-4 flex flex-col gap-3"
					>
						<input type="hidden" name="id" value={citaSel.id} />
						<label class="flex flex-col gap-1.5">
							<span class="text-ink-soft text-xs font-semibold">Servicio</span>
							<select name="servicioId" required class={inputSheet}>
								{#each data.serviciosActivos as servicio (servicio.id)}
									<option value={servicio.id} selected={servicio.id === citaSel.servicioId}
										>{servicio.nombre} · {servicio.duracionMin} min</option
									>
								{/each}
							</select>
						</label>
						<div class="flex gap-2.5">
							<label class="flex min-w-0 flex-1 flex-col gap-1.5">
								<span class="text-ink-soft text-xs font-semibold">Fecha</span>
								<input name="fecha" type="date" required value={citaSel.fecha} class={inputSheet} />
							</label>
							<label class="flex min-w-0 flex-1 flex-col gap-1.5">
								<span class="text-ink-soft text-xs font-semibold">Hora</span>
								<input
									name="horaInicio"
									type="time"
									required
									value={citaSel.horaInicio}
									step="900"
									class={inputSheet}
								/>
							</label>
						</div>
						{#if form && 'sheet' in form && form.sheet === 'editar'}<p
								class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm"
							>
								{form.error}
							</p>{/if}
						<button
							type="submit"
							class="rounded-2xl from-primary to-primary-light mt-2 bg-gradient-to-br px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(217,127,106,.6)] transition active:scale-[.98]"
						>
							Guardar cambios
						</button>
						<button
							type="button"
							onclick={() => (editando = false)}
							class="text-ink-soft py-1 text-sm font-semibold"
						>
							Cancelar
						</button>
					</form>
				{:else}
					<div class="mt-5 flex gap-2.5">
						<button
							type="button"
							onclick={() => (editando = true)}
							class="rounded-field from-primary to-primary-light flex-1 bg-gradient-to-br px-4 py-3 text-sm font-bold text-white"
						>
							Editar
						</button>
						<form method="POST" action="?/cancelar" use:enhance={alGuardar} class="flex-1">
							<input type="hidden" name="id" value={citaSel.id} />
							<button
								type="submit"
								class="rounded-field border-line text-blush-deep w-full border bg-white px-4 py-3 text-sm font-bold"
							>
								Cancelar cita
							</button>
						</form>
					</div>
				{/if}
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
		</div>
	</div>
{/if}
