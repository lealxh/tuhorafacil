<script lang="ts">
	import { onMount } from 'svelte';

	// slug incluye el @ (ej. "@salonregias"); es la base del endpoint /{slug}/chat
	let { slug, negocio, sitekey }: { slug: string; negocio: string; sitekey: string } = $props();

	type Mensaje = { rol: string; contenido: string };
	let mensajes: Mensaje[] = $state([]);
	let texto = $state('');
	let enviando = $state(false);
	let pendiente: string | null = $state(null);
	let sesion = '';
	let hilo: HTMLDivElement | undefined = $state();

	// Turnstile (anti-bot): se muestra hasta la primera verificación exitosa
	let turnstileEl: HTMLDivElement | undefined = $state();
	let verificado = $state(false);
	let tsToken = $state('');
	let tsWidgetId: string | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ts = () => (window as any).turnstile;

	function alFondo() {
		queueMicrotask(() => hilo?.scrollTo({ top: hilo.scrollHeight }));
	}

	function cargarScriptTurnstile(): Promise<void> {
		return new Promise((resolve) => {
			if (ts()) return resolve();
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.defer = true;
			s.onload = () => resolve();
			document.head.appendChild(s);
		});
	}

	async function iniciarTurnstile() {
		if (!sitekey || !turnstileEl) return;
		await cargarScriptTurnstile();
		tsWidgetId = ts().render(turnstileEl, {
			sitekey,
			action: 'turnstile-spin-v1',
			callback: (t: string) => (tsToken = t),
			'error-callback': () => (tsToken = ''),
			'expired-callback': () => (tsToken = '')
		});
	}

	onMount(async () => {
		const key = `thf_chat_${slug}`;
		sesion = localStorage.getItem(key) ?? '';
		if (!sesion) {
			sesion = crypto.randomUUID();
			localStorage.setItem(key, sesion);
		}
		try {
			const r = await fetch(`/${slug}/chat?sesion=${sesion}`);
			if (r.ok) mensajes = ((await r.json()) as { mensajes?: Mensaje[] }).mensajes ?? [];
		} catch {
			/* sin historial, se empieza de cero */
		}
		if (mensajes.length > 0) verificado = true; // ya conversó antes: la cookie cubre la sesión
		await iniciarTurnstile();
		alFondo();
	});

	async function enviar() {
		const t = texto.trim();
		if (!t || enviando) return;
		// Anti-bot: hasta verificar, exige el token de Turnstile
		if (sitekey && !verificado && !tsToken) return;
		pendiente = t;
		texto = '';
		enviando = true;
		alFondo();
		try {
			const r = await fetch(`/${slug}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sesion, texto: t, turnstileToken: tsToken })
			});
			mensajes = [...mensajes, { rol: 'clienta', contenido: t }];
			if (r.ok) {
				verificado = true; // el server dejó la cookie; ya no hace falta el widget
			} else if (ts() && tsWidgetId !== undefined) {
				ts().reset(tsWidgetId); // token consumido/ inválido → refrescar
				tsToken = '';
			}
			const respuesta = r.ok
				? ((await r.json()) as { texto: string }).texto
				: 'No pude responder ahora 🙏 Intenta de nuevo o reserva con el botón de arriba.';
			mensajes = [...mensajes, { rol: 'agente', contenido: respuesta }];
		} catch {
			mensajes = [
				...mensajes,
				{ rol: 'clienta', contenido: t },
				{ rol: 'agente', contenido: 'Se cortó la conexión 🙏 Intenta de nuevo.' }
			];
		} finally {
			enviando = false;
			pendiente = null;
			alFondo();
		}
	}

	function onKey(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			enviar();
		}
	}
</script>

<div class="rounded-card border-line overflow-hidden border bg-white shadow-sm">
	<div class="from-primary to-primary-light flex items-center gap-2.5 bg-gradient-to-br px-4 py-3 text-white">
		<span class="text-lg">💬</span>
		<div class="min-w-0">
			<p class="text-sm font-bold">Chatea y agenda al tiro</p>
			<p class="text-[11px] text-white/85">Te atiende el asistente de {negocio}</p>
		</div>
	</div>

	<div bind:this={hilo} class="hilo flex max-h-[340px] min-h-[180px] flex-col gap-2 overflow-y-auto px-3.5 py-3">
		{#each mensajes as mensaje, i (i)}
			<div
				class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap {mensaje.rol === 'clienta'
					? 'bg-blush text-ink self-end'
					: 'bg-surface self-start'}"
			>
				{mensaje.contenido}
			</div>
		{/each}
		{#if pendiente}
			<div class="bg-blush text-ink max-w-[85%] self-end rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap">
				{pendiente}
			</div>
		{/if}
		{#if enviando}
			<div class="bg-surface self-start rounded-2xl px-3.5 py-2 text-sm">
				<span class="text-ink-faint">escribiendo…</span>
			</div>
		{:else if mensajes.length === 0 && !pendiente}
			<p class="text-ink-soft m-auto max-w-[16rem] text-center text-sm">
				Escríbele, por ejemplo, <strong>«hola, quiero agendar un corte»</strong> 💇‍♀️
			</p>
		{/if}
	</div>

	<div class="border-line flex flex-col gap-2 border-t p-2.5">
		{#if sitekey && !verificado}
			<div bind:this={turnstileEl} class="flex justify-center"></div>
		{/if}
		<div class="flex items-end gap-2">
			<textarea
				bind:value={texto}
				rows="1"
				placeholder="Escribe aquí…"
				enterkeyhint="send"
				onkeydown={onKey}
				class="input-base bg-surface flex-1 resize-none px-3.5 py-2.5 text-[16px]"
			></textarea>
			<button
				onclick={enviar}
				disabled={enviando || !texto.trim() || (!!sitekey && !verificado && !tsToken)}
				class="btn-primary rounded-field px-4 py-2.5 text-sm disabled:opacity-50"
			>
				Enviar
			</button>
		</div>
	</div>
</div>

<style>
	.hilo {
		scrollbar-width: thin;
		scrollbar-color: var(--color-line) transparent;
	}
	.hilo::-webkit-scrollbar {
		width: 6px;
	}
	.hilo::-webkit-scrollbar-thumb {
		background: var(--color-line);
		border-radius: 3px;
	}
</style>
