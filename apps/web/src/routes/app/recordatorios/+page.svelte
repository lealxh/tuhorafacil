<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let generando = $state(false);

	const RESPUESTAS = {
		confirmada: '✅ Confirmo mi hora',
		reagendar: '📅 Quiero reagendar'
	} as const;
</script>

<svelte:head><title>Recordatorios · tuhorafácil</title></svelte:head>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 lg:p-8">
	<div class="lg:hidden">
		<a href="/app/agente" class="text-ink-soft text-xs font-semibold">‹ Mi agente</a>
		<h1 class="mt-1 text-2xl font-bold tracking-tight">Recordatorios</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Lo que recibirán tus clientas antes de su cita.</p>
	</div>

	{#if !data.tieneRecordatorios}
		<div class="rounded-card flex flex-col items-center gap-3 bg-white p-8 text-center shadow-sm">
			<div class="bg-blush flex h-14 w-14 items-center justify-center rounded-full text-2xl">🔔</div>
			<p class="text-sm font-semibold">Tu plan no incluye recordatorios</p>
			<p class="text-ink-soft text-sm">
				Con el plan <strong>Pro</strong>, tus clientas reciben un recordatorio por WhatsApp el día
				antes de su cita, con botones para confirmar o reagendar.
			</p>
			<a href="/app/plan" class="text-blush-deep text-sm font-bold">Ver planes ›</a>
		</div>
	{:else}
		<div
			class="rounded-card bg-amber-100/60 border-amber-300/50 border px-4 py-2.5 text-xs font-semibold text-amber-800"
		>
			Vista de prueba: esto es lo que recibirá cada clienta por WhatsApp cuando Meta apruebe las
			plantillas. Mientras tanto, los recordatorios se generan igual (cada hora, para las citas de
			hoy: aviso matinal + rezagadas con anticipación mínima) y se muestran aquí. Los botones
			simulan la respuesta de la clienta.
		</div>

		<form
			method="POST"
			action="?/generar"
			use:enhance={() => {
				generando = true;
				return async ({ update }) => {
					await update();
					generando = false;
				};
			}}
		>
			<button
				type="submit"
				disabled={generando}
				class="btn-primary rounded-field w-full px-4 py-3 text-sm disabled:opacity-50 lg:w-auto"
			>
				{generando ? 'Generando…' : 'Generar los recordatorios de hoy ahora'}
			</button>
		</form>
		{#if form && 'generados' in form}
			<p class="text-success text-xs font-semibold">
				{form.generados === 0
					? 'Nada nuevo que recordar: ninguna cita de hoy corresponde según las reglas de envío.'
					: `${form.generados} ${form.generados === 1 ? 'recordatorio generado' : 'recordatorios generados'} ✓`}
			</p>
		{/if}
		{#if form && 'error' in form && form.error}<p class="form-error">{form.error}</p>{/if}

		<div class="flex flex-col gap-4">
			{#each data.recordatorios as recordatorio (recordatorio.id)}
				<div class="flex flex-col gap-1.5">
					<p class="text-ink-soft text-xs font-semibold">
						Para {recordatorio.clienta} · cita {recordatorio.fecha} {recordatorio.horaInicio} ·
						{recordatorio.servicio}
					</p>
					<!-- Burbuja como la vería la clienta en WhatsApp -->
					<div class="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
						<p class="text-sm leading-relaxed whitespace-pre-wrap">{recordatorio.contenido}</p>
						<div class="border-line mt-3 flex flex-col gap-1.5 border-t pt-2.5">
							{#each Object.entries(RESPUESTAS) as [valor, etiqueta] (valor)}
								<form method="POST" action="?/responder" use:enhance>
									<input type="hidden" name="id" value={recordatorio.id} />
									<input type="hidden" name="respuesta" value={valor} />
									<button
										type="submit"
										disabled={recordatorio.respuesta !== null}
										class="w-full rounded-lg py-2 text-center text-sm font-semibold text-[#00A5F4] transition active:scale-[.98] {recordatorio.respuesta ===
										valor
											? 'bg-blush'
											: 'bg-surface disabled:opacity-40'}"
									>
										{etiqueta}
									</button>
								</form>
							{/each}
						</div>
					</div>
					{#if recordatorio.respuesta}
						<!-- Respuesta simulada de la clienta -->
						<div class="bg-blush max-w-[85%] self-end rounded-2xl rounded-br-md px-4 py-2.5">
							<p class="text-sm">{RESPUESTAS[recordatorio.respuesta]}</p>
						</div>
						<p class="text-xs font-semibold {recordatorio.respuesta === 'confirmada' ? 'text-success' : 'text-blush-deep'} self-end">
							{recordatorio.respuesta === 'confirmada'
								? 'La clienta confirmó ✓'
								: 'La clienta quiere reagendar: el agente se encargará por WhatsApp'}
						</p>
					{/if}
				</div>
			{:else}
				<p class="text-ink-soft rounded-card bg-white px-4 py-6 text-center text-sm shadow-sm">
					Aún no hay recordatorios. Crea una cita para hoy (a una hora que aún no llegue) en el
					calendario y usa el botón de arriba.
				</p>
			{/each}
		</div>
	{/if}
</main>
