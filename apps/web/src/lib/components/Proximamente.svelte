<script lang="ts">
	let { titulo, detalle, icono }: { titulo: string; detalle: string; icono: string } = $props();
</script>

<main class="flex flex-col gap-4 p-6">
	<h1 class="text-2xl font-bold tracking-tight">{titulo}</h1>
	<div class="rounded-card flex flex-col items-center gap-3 bg-white p-8 text-center shadow-sm">
		<div class="bg-blush flex h-14 w-14 items-center justify-center rounded-full text-2xl">{icono}</div>
		<p class="text-sm font-semibold">Muy pronto</p>
		<p class="text-ink-soft text-sm">{detalle}</p>
	</div>
</main>
