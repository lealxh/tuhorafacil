<script lang="ts">
	import ServiciosEditor from '$lib/components/ServiciosEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Servicios · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6 lg:mx-auto lg:w-full lg:max-w-2xl lg:p-8">
	<div class="lg:hidden">
		<a href="/app" class="text-ink-soft text-xs font-semibold">‹ Hoy</a>
		<h1 class="mt-1 text-2xl font-bold tracking-tight">Servicios</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Lo que tu agente puede agendar.</p>
	</div>

	<ServiciosEditor servicios={data.servicios} error={form?.error} />
</main>
