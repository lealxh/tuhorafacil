<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Íconos del mock aprobado (Tuhorafacil.dc.html, sección BOTTOM TABS)
	const TABS = [
		{
			href: '/app',
			etiqueta: 'Hoy',
			etiquetaDesktop: 'Citas de hoy',
			icono: '<rect x="3.5" y="5" width="17" height="15" rx="4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/>'
		},
		{
			href: '/app/calendario',
			etiqueta: 'Agenda',
			etiquetaDesktop: 'Calendario',
			icono: '<rect x="3.5" y="5" width="17" height="15" rx="4"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2M14 13h2M8 16.5h2M14 16.5h2"/>'
		},
		{
			href: '/app/agente',
			etiqueta: 'Agente',
			etiquetaDesktop: 'Mi agente',
			icono: '<path d="M4 11.5a7.5 6.5 0 1 1 3 5.2L3.5 18l.9-2.6A6.3 6.3 0 0 1 4 11.5Z"/><path d="M12 6.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3.9-1.9Z"/>'
		},
		{
			href: '/app/pagina',
			etiqueta: 'Mi página',
			etiquetaDesktop: 'Mi página',
			icono: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.2 2.4 14 0 16.4M12 3.8c-2.4 2.2-2.4 14 0 16.4"/>'
		},
		{
			href: '/app/plan',
			etiqueta: 'Plan',
			etiquetaDesktop: 'Consumo',
			icono: '<path d="M4 20h16"/><rect x="5.5" y="12" width="3.2" height="6" rx="1.4"/><rect x="10.5" y="8" width="3.2" height="10" rx="1.4"/><rect x="15.5" y="5" width="3.2" height="13" rx="1.4"/>'
		}
	];

	const TIERS: Record<string, string> = { agenda: 'Agenda', recepcionista: 'Recepcionista', pro: 'Pro' };

	// Header desktop del mock: título + subtítulo por sección
	const CABECERAS: Record<string, [string, string]> = {
		'/app': ['Citas de hoy', 'La pantalla que más vas a mirar'],
		'/app/calendario': ['Calendario', 'Tus citas de un vistazo'],
		'/app/agente': ['Mi agente', 'Responde tus WhatsApp y agenda por ti'],
		'/app/pagina': ['Mi página', 'Tu link para la bio de Instagram'],
		'/app/plan': ['Consumo', 'Tu plan y el uso del mes'],
		'/app/servicios': ['Servicios', 'Lo que tu agente puede agendar'],
		'/app/horarios': ['Horarios', 'Tu disponibilidad semanal'],
		'/app/cuenta': ['Tu cuenta', 'Perfil y seguridad']
	};
	const cabecera = $derived(CABECERAS[page.url.pathname] ?? null);

	const enOnboarding = $derived(page.url.pathname.startsWith('/app/onboarding'));
	const conShell = $derived(Boolean(data.estilista) && !enOnboarding);
	const activo = (href: string) =>
		href === '/app' ? page.url.pathname === '/app' : page.url.pathname.startsWith(href);
</script>

{#snippet icono(paths: string, cls: string)}
	<svg
		viewBox="0 0 24 24"
		class={cls}
		fill="none"
		stroke="currentColor"
		stroke-width="1.7"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- paths estáticos del design system -->
		{@html paths}
	</svg>
{/snippet}

<div class="min-h-screen {conShell ? 'lg:flex' : ''}">
	{#if conShell}
		<!-- Sidebar desktop -->
		<aside class="bg-surface border-line sticky top-0 hidden h-screen w-[236px] flex-none flex-col border-r px-4 py-6 lg:flex">
			<a href="/app" class="flex items-center gap-2.5 px-1.5">
				<span
					class="rounded-field from-primary to-primary-light flex h-8 w-8 items-center justify-center bg-gradient-to-br text-base font-extrabold text-white"
				>
					t
				</span>
				<span class="text-base font-bold tracking-tight">tuhorafácil</span>
			</a>

			<nav class="mt-7 flex flex-col gap-1">
				{#each TABS as tab (tab.href)}
					<a
						href={tab.href}
						class="rounded-[13px] flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition {activo(tab.href)
							? 'text-primary bg-white shadow-sm'
							: 'text-ink-soft hover:bg-white/60'}"
					>
						{@render icono(tab.icono, 'h-5 w-5')}
						{tab.etiquetaDesktop}
					</a>
				{/each}
			</nav>

			<a
				href="/app/cuenta"
				class="border-line hover:bg-white/60 mt-auto flex items-center gap-3 rounded-[13px] border-t px-1.5 pt-4 pb-1.5 transition"
			>
				<span
					class="from-primary to-primary-light flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white"
				>
					{data.user.name.charAt(0).toUpperCase()}
				</span>
				<span class="min-w-0">
					<span class="block truncate text-[13px] font-semibold">{data.user.name} · {data.estilista?.nombreNegocio}</span>
					<span class="text-ink-soft block text-[11px]">Plan {TIERS[data.tierNombre ?? ''] ?? '—'}</span>
				</span>
			</a>
		</aside>
	{/if}

	<div class="min-w-0 flex-1 {conShell ? 'pb-24 lg:pb-8' : ''}">
		{#if conShell && cabecera}
			<div class="border-line hidden items-center justify-between border-b px-8 py-5 lg:flex">
				<div>
					<h1 class="text-[21px] font-bold tracking-tight">{cabecera[0]}</h1>
					<p class="text-ink-soft mt-0.5 text-[13px]">{cabecera[1]}</p>
				</div>
				<a
					href="/app/calendario?nueva=1"
					class="rounded-[13px] from-primary to-primary-light bg-gradient-to-br px-4.5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(217,127,106,.6)] transition active:scale-[.98]"
				>
					+ Nueva cita
				</a>
			</div>
		{/if}
		<div class="mx-auto w-full max-w-md {conShell ? 'lg:max-w-5xl lg:px-4' : ''}">
			{@render children()}
		</div>
	</div>
</div>

{#if conShell}
	<!-- Tabs móviles -->
	<nav
		class="border-line fixed inset-x-0 bottom-0 border-t bg-white lg:hidden"
		style="box-shadow:0 -4px 18px rgba(160,90,70,.05);padding-bottom:env(safe-area-inset-bottom)"
	>
		<div class="mx-auto flex w-full max-w-md px-2 pt-1.5 pb-2">
			{#each TABS as tab (tab.href)}
				<a
					href={tab.href}
					class="flex flex-1 flex-col items-center gap-[3px] py-1 text-[9.5px] font-semibold tracking-wide {activo(tab.href)
						? 'text-primary'
						: 'text-ink-faint'}"
				>
					{@render icono(tab.icono, 'h-[22px] w-[22px]')}
					{tab.etiqueta}
				</a>
			{/each}
		</div>
	</nav>
{/if}
