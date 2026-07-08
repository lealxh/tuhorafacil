<script lang="ts">
	let { children } = $props();
</script>

<div class="bg-background min-h-dvh">
	<header class="bg-surface border-line flex items-center justify-between border-b px-6 py-3">
		<div class="flex items-center gap-5">
			<h1 class="text-lg font-bold tracking-tight">Admin · tuhorafácil</h1>
			<nav class="flex gap-4 text-sm font-semibold">
				<a href="/admin" class="text-ink-soft">Cuentas</a>
				<a href="/admin/prompt" class="text-ink-soft">Prompt del agente</a>
			</nav>
		</div>
		<a href="/app" class="text-blush-deep text-sm font-semibold">‹ Volver a la app</a>
	</header>
	{@render children()}
</div>
