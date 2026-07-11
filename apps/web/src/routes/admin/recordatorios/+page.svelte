<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Recordatorios · Admin</title></svelte:head>

<main class="mx-auto flex w-full max-w-xl flex-col gap-4 p-6 lg:p-8">
	<div>
		<h2 class="text-lg font-bold tracking-tight">Reglas de recordatorios</h2>
		<p class="text-ink-soft mt-0.5 text-sm">
			Se aplican a <strong>todas</strong> las cuentas Pro. El cron corre cada hora sobre las citas
			del día.
		</p>
	</div>

	<form
		method="POST"
		action="?/guardar"
		use:enhance
		class="rounded-card flex flex-col gap-4 bg-white p-5 shadow-sm"
	>
		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-semibold">Hora del envío matinal</span>
			<input
				name="horaEnvio"
				type="time"
				required
				value={data.config.horaEnvio}
				class="input-base bg-surface"
			/>
			<span class="text-ink-faint text-xs">
				A esta hora (hora de Chile) se recuerdan todas las citas del día que ya estaban agendadas.
			</span>
		</label>

		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-semibold">Aviso mínimo para citas agendadas durante el día</span>
			<input
				name="horasMinimas"
				type="number"
				required
				min="0"
				max="12"
				step="1"
				value={data.config.horasMinimas}
				class="input-base bg-surface"
			/>
			<span class="text-ink-faint text-xs">
				Horas. Una cita agendada después del envío matinal recibe su recordatorio en el siguiente
				ciclo solo si falta al menos esto para la cita; si falta menos, no se le recuerda (la
				clienta acaba de agendar).
			</span>
		</label>

		{#if form && 'error' in form && form.error}<p class="form-error">{form.error}</p>{/if}
		{#if form && 'guardado' in form}<p class="text-success text-xs font-semibold">
				Guardado ✓ — el próximo ciclo del cron ya usa estas reglas.
			</p>{/if}

		<button type="submit" class="btn-primary rounded-field px-4 py-3 text-sm">Guardar</button>
	</form>
</main>
