<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const activo = $derived(data.config?.activo ?? true);
	const waConectado = $derived(data.estilista?.waEstado === 'activo');
	let escaladaSel: (typeof data.escaladas)[number] | null = $state(null);

	const PERSONALIDADES = [
		['cercana', 'Cercana'],
		['neutral', 'Neutral'],
		['formal', 'Formal']
	] as const;
</script>

<svelte:head><title>Mi agente · tuhorafácil</title></svelte:head>

{#snippet statTiles(clase: string)}
	<div class="{clase} gap-2.5">
		<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
			<p class="text-lg font-bold">
				{data.consumo?.mensajesAgente ?? 0}<span class="text-ink-faint text-xs font-medium"
					>{data.limiteMensajes ? ` / ${data.limiteMensajes}` : ''}</span
				>
			</p>
			<p class="text-ink-soft text-[11px]">mensajes este mes</p>
		</div>
		<div class="rounded-card flex-1 bg-white px-4 py-3 shadow-sm">
			<p class="text-success text-lg font-bold">{data.consumo?.citasCreadas ?? 0}</p>
			<p class="text-ink-soft text-[11px]">citas agendadas</p>
		</div>
	</div>
{/snippet}

<main class="flex flex-col gap-4 p-6 lg:p-8">
	<div class="lg:hidden">
		<h1 class="text-2xl font-bold tracking-tight">Mi agente</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Responde tus WhatsApp y agenda por ti.</p>
	</div>

	{#if !data.tieneAgente}
		<div class="rounded-card flex flex-col items-center gap-3 bg-white p-8 text-center shadow-sm">
			<div class="bg-blush flex h-14 w-14 items-center justify-center rounded-full text-2xl">
				✨
			</div>
			<p class="text-sm font-semibold">Tu plan no incluye el agente</p>
			<p class="text-ink-soft text-sm">
				Con el plan <strong>Recepcionista</strong> tu agente responde WhatsApp y agenda citas mientras
				trabajas.
			</p>
			<a href="/app/plan" class="text-blush-deep text-sm font-bold">Ver planes ›</a>
		</div>
	{:else}
		<div class="contents lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
			<div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
				<!-- Estado + toggle -->
				<div
					class="rounded-card flex items-center gap-3.5 p-4 shadow-sm {activo && waConectado
						? 'from-primary to-primary-light bg-gradient-to-br text-white'
						: 'bg-white'}"
				>
					<div
						class="flex h-11 w-11 items-center justify-center rounded-2xl text-xl {activo &&
						waConectado
							? 'bg-white/20'
							: 'bg-blush'}"
					>
						{activo && waConectado ? '✨' : '😴'}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-[15px] font-bold">
							{!waConectado ? 'WhatsApp sin conectar' : activo ? 'Trabajando por ti' : 'En pausa'}
						</p>
						<p class="text-xs {activo && waConectado ? 'text-white/85' : 'text-ink-soft'}">
							{!waConectado
								? 'Se activa cuando conectes tu número'
								: activo
									? 'Respondiendo y agendando en tu WhatsApp'
									: 'Tú respondes manualmente'}
						</p>
					</div>
					<form method="POST" action="?/toggle" use:enhance>
						<input type="hidden" name="activo" value={String(!activo)} />
						<button
							type="submit"
							role="switch"
							aria-checked={activo}
							aria-label="{activo ? 'Pausar' : 'Activar'} agente"
							class="relative h-[30px] w-[52px] rounded-full transition {activo
								? waConectado
									? 'bg-white/30'
									: 'bg-success'
								: 'bg-line'}"
						>
							<span
								class="absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-all {activo
									? 'left-[25px]'
									: 'left-[3px]'}"
							></span>
						</button>
					</form>
				</div>

				<a
					href="/app/probar-agente"
					class="rounded-card border-line flex items-center gap-2 border bg-white px-4 py-3 text-sm font-semibold shadow-sm"
				>
					<span class="text-base">💬</span>
					<span class="flex-1">Probar agente</span>
					<span class="text-ink-faint">›</span>
				</a>

				{@render statTiles('flex lg:hidden')}

				<!-- Personalidad -->
				<div>
					<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Personalidad</h2>
					<div class="mt-2.5 flex gap-2">
						{#each PERSONALIDADES as [valor, etiqueta] (valor)}
							<form method="POST" action="?/personalidad" use:enhance class="flex-1">
								<input type="hidden" name="personalidad" value={valor} />
								<button
									type="submit"
									class="rounded-field w-full border py-2.5 text-[13px] font-semibold transition {(data
										.config?.personalidad ?? 'cercana') === valor
										? 'border-primary bg-blush text-blush-deep'
										: 'border-line text-ink-soft bg-white'}"
								>
									{etiqueta}
								</button>
							</form>
						{/each}
					</div>
				</div>

				<!-- Instrucciones -->
				<form
					method="POST"
					action="?/instrucciones"
					use:enhance
					class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm"
				>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-bold tracking-wider uppercase"
							>Instrucciones para tu agente</span
						>
						<textarea
							name="instrucciones"
							rows="3"
							placeholder="Ej: Tuteo chileno. Pedir abono del 30% para balayage. No agendar después de las 18:00 los viernes."
							class="rounded-field border-line focus:border-primary bg-surface border px-3.5 py-2.5 text-sm"
							>{data.config?.instrucciones ?? ''}</textarea
						>
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="text-ink-soft text-xs font-bold tracking-wider uppercase"
							>Información extra</span
						>
						<textarea
							name="infoExtra"
							rows="2"
							placeholder="Ej: link de pago, cómo llegar, estacionamiento…"
							class="rounded-field border-line focus:border-primary bg-surface border px-3.5 py-2.5 text-sm"
							>{data.config?.infoExtra ?? ''}</textarea
						>
					</label>
					{#if form && 'guardado' in form}<p class="text-success text-xs font-semibold">
							Guardado ✓
						</p>{/if}
					<button
						type="submit"
						class="rounded-field bg-blush text-blush-deep px-4 py-2.5 text-sm font-bold"
						>Guardar</button
					>
				</form>
			</div>

			<div class="contents lg:flex lg:flex-col lg:gap-4">
				{@render statTiles('hidden lg:flex')}

				<!-- Escalados -->
				<div class="flex items-center justify-between">
					<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">
						Escalados pendientes
					</h2>
					{#if data.escaladas.length}
						<span class="bg-primary-light rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
							>{data.escaladas.length}</span
						>
					{/if}
				</div>
				<div class="flex flex-col gap-2.5">
					{#each data.escaladas as escalada (escalada.id)}
						<button
							onclick={() => (escaladaSel = escalada)}
							class="rounded-card border-primary-light flex w-full items-center gap-3 border-l-[3px] bg-white px-4 py-3 text-left shadow-sm"
						>
							<span
								class="from-primary to-primary-light flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white"
							>
								{escalada.clienta.charAt(0)}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{escalada.clienta}</span>
								<span class="text-ink-soft block truncate text-xs">
									{escalada.mensajes.at(-1)?.contenido ?? ''}
								</span>
							</span>
						</button>
					{:else}
						<p class="text-ink-soft rounded-card bg-white px-4 py-4 text-center text-sm shadow-sm">
							Nada pendiente: tu agente tiene todo bajo control ✨
						</p>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</main>

{#if escaladaSel}
	<div
		class="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center lg:p-6 bg-[rgba(40,20,18,.4)]"
		onclick={(e) => e.target === e.currentTarget && (escaladaSel = null)}
		onkeydown={(e) => e.key === 'Escape' && (escaladaSel = null)}
		role="presentation"
	>
		<div
			class="bg-background w-full rounded-t-[28px] px-6 pt-2.5 pb-8 lg:max-w-md lg:rounded-[28px] lg:pb-6"
		>
			<div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#E0C4B8]"></div>
			<h2 class="text-xl font-bold tracking-tight">{escaladaSel.clienta}</h2>
			<p class="text-ink-soft mt-0.5 text-xs">Escalado por tu agente</p>

			<div class="mt-4 flex flex-col gap-2">
				{#each escaladaSel.mensajes as mensaje, i (i)}
					<div
						class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm {mensaje.rol === 'clienta'
							? 'self-start bg-white shadow-sm'
							: 'bg-blush text-ink self-end'}"
					>
						{mensaje.contenido}
					</div>
				{/each}
			</div>

			<div class="mt-5 flex gap-3">
				<form
					method="POST"
					action="?/seguirAgente"
					use:enhance={() =>
						async ({ update }) => {
							escaladaSel = null;
							await update();
						}}
					class="flex-1"
				>
					<input type="hidden" name="id" value={escaladaSel.id} />
					<button
						type="submit"
						class="rounded-field border-line text-ink-soft w-full border bg-white px-4 py-3 text-sm font-bold"
					>
						Que siga el agente
					</button>
				</form>
				<form
					method="POST"
					action="?/responderYo"
					use:enhance={() =>
						async ({ update }) => {
							escaladaSel = null;
							await update();
						}}
					class="flex-1"
				>
					<input type="hidden" name="id" value={escaladaSel.id} />
					<button
						type="submit"
						class="rounded-field from-primary to-primary-light w-full bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(217,127,106,.6)]"
					>
						Responder yo
					</button>
				</form>
			</div>
			<p class="text-ink-faint mt-3 text-center text-[11px]">
				"Responder yo" pausa el agente 1 hora en esta conversación: contéstale desde tu WhatsApp.
			</p>
		</div>
	</div>
{/if}
