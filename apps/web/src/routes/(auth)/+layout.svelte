<script lang="ts">
	let { children } = $props();
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
	<div class="flex items-center gap-2.5">
		<div
			class="rounded-field from-primary to-primary-light flex h-9 w-9 items-center justify-center bg-gradient-to-br text-xl font-extrabold text-white"
		>
			t
		</div>
		<span class="text-lg font-bold tracking-tight">tuhorafácil</span>
	</div>
	{@render children()}
</main>
