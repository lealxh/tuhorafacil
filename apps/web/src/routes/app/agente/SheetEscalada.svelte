<script lang="ts">
	import { enhance } from '$app/forms';

	interface Escalada {
		id: string;
		clienta: string;
		mensajes: { rol: string; contenido: string }[];
	}

	let { escalada, onCerrar }: { escalada: Escalada; onCerrar: () => void } = $props();

	const alResolver = () =>
		async ({ update }: { update: () => Promise<void> }) => {
			onCerrar();
			await update();
		};
</script>

<h2 class="text-xl font-bold tracking-tight">{escalada.clienta}</h2>
<p class="text-ink-soft mt-0.5 text-xs">Escalado por tu agente</p>

<div class="mt-4 flex flex-col gap-2">
	{#each escalada.mensajes as mensaje, i (i)}
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
	<form method="POST" action="?/seguirAgente" use:enhance={alResolver} class="flex-1">
		<input type="hidden" name="id" value={escalada.id} />
		<button
			type="submit"
			class="rounded-field border-line text-ink-soft w-full border bg-white px-4 py-3 text-sm font-bold"
		>
			Que siga el agente
		</button>
	</form>
	<form method="POST" action="?/responderYo" use:enhance={alResolver} class="flex-1">
		<input type="hidden" name="id" value={escalada.id} />
		<button type="submit" class="btn-primary rounded-field w-full px-4 py-3 text-sm">
			Responder yo
		</button>
	</form>
</div>
<p class="text-ink-faint mt-3 text-center text-[11px]">
	"Responder yo" pausa el agente 1 hora en esta conversación: contéstale desde tu WhatsApp.
</p>
