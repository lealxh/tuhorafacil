<script lang="ts">
	let { children } = $props();
</script>

<div class="bg-background min-h-dvh">
	<header class="bg-surface border-line flex items-center justify-between border-b px-6 py-3">
		<h1 class="text-lg font-bold tracking-tight">Admin · tuhorafácil</h1>
		<a href="/app" class="text-blush-deep text-sm font-semibold">‹ Volver a la app</a>
	</header>
	{@render children()}
</div>
