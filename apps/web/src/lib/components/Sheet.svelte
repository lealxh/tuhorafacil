<script lang="ts">
	import type { Snippet } from 'svelte';

	let { onCerrar, children }: { onCerrar: () => void; children: Snippet } = $props();

	// Foco inicial en el diálogo para que Escape funcione sin interacción previa
	function focoInicial(nodo: HTMLElement) {
		nodo.focus();
	}
</script>

<div
	class="fixed inset-0 z-40 flex items-end bg-[rgba(40,20,18,.4)] lg:items-center lg:justify-center lg:p-6"
	onclick={(e) => e.target === e.currentTarget && onCerrar()}
	onkeydown={(e) => e.key === 'Escape' && onCerrar()}
	role="presentation"
>
	<div
		use:focoInicial
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		class="bg-background w-full rounded-t-[28px] px-6 pt-2.5 pb-8 outline-none lg:max-w-md lg:rounded-[28px] lg:pb-6"
	>
		<div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#e0c4b8]"></div>
		{@render children()}
	</div>
</div>
