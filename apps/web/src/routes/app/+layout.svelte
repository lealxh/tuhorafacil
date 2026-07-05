<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Íconos del mock aprobado (Tuhorafacil.dc.html, sección BOTTOM TABS)
	const TABS = [
		{
			href: '/app',
			etiqueta: 'Hoy',
			icono: '<rect x="3.5" y="5" width="17" height="15" rx="4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/>'
		},
		{
			href: '/app/calendario',
			etiqueta: 'Agenda',
			icono: '<rect x="3.5" y="5" width="17" height="15" rx="4"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2M14 13h2M8 16.5h2M14 16.5h2"/>'
		},
		{
			href: '/app/agente',
			etiqueta: 'Agente',
			icono: '<path d="M4 11.5a7.5 6.5 0 1 1 3 5.2L3.5 18l.9-2.6A6.3 6.3 0 0 1 4 11.5Z"/><path d="M12 6.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3.9-1.9Z"/>'
		},
		{
			href: '/app/pagina',
			etiqueta: 'Mi página',
			icono: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.2 2.4 14 0 16.4M12 3.8c-2.4 2.2-2.4 14 0 16.4"/>'
		},
		{
			href: '/app/plan',
			etiqueta: 'Plan',
			icono: '<path d="M4 20h16"/><rect x="5.5" y="12" width="3.2" height="6" rx="1.4"/><rect x="10.5" y="8" width="3.2" height="10" rx="1.4"/><rect x="15.5" y="5" width="3.2" height="13" rx="1.4"/>'
		}
	];

	const enOnboarding = $derived(page.url.pathname.startsWith('/app/onboarding'));
	const activo = (href: string) =>
		href === '/app' ? page.url.pathname === '/app' : page.url.pathname.startsWith(href);
</script>

<div class="mx-auto min-h-screen w-full max-w-md {data.estilista && !enOnboarding ? 'pb-24' : ''}">
	{@render children()}
</div>

{#if data.estilista && !enOnboarding}
	<nav
		class="border-line fixed inset-x-0 bottom-0 border-t bg-white"
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
					<svg
						viewBox="0 0 24 24"
						class="h-[22px] w-[22px]"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- paths estáticos del design system -->
						{@html tab.icono}
					</svg>
					{tab.etiqueta}
				</a>
			{/each}
		</div>
	</nav>
{/if}
