<script lang="ts">
	import { enhance } from '$app/forms';

	// Las acciones viven en /app/servicios: este editor se usa allí y en Mi página
	let {
		servicios,
		error
	}: {
		servicios: { id: string; nombre: string; duracionMin: number; precio: number; activo: boolean }[];
		error?: string | null;
	} = $props();

	const clp = (n: number) => '$' + n.toLocaleString('es-CL');
	const inputCls =
		'rounded-field border-line focus:border-primary focus:ring-primary/30 border bg-surface px-4 py-2.5 text-sm';
</script>

<div class="flex flex-col gap-2.5">
	{#each servicios as servicio (servicio.id)}
		<div class="rounded-card flex items-center gap-3 bg-white px-4 py-3.5 shadow-sm {servicio.activo ? '' : 'opacity-50'}">
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold">{servicio.nombre}</p>
				<p class="text-ink-soft text-xs">{servicio.duracionMin} min · {clp(servicio.precio)}</p>
			</div>
			<form method="POST" action="/app/servicios?/toggle" use:enhance>
				<input type="hidden" name="id" value={servicio.id} />
				<button
					type="submit"
					role="switch"
					aria-checked={servicio.activo}
					aria-label="{servicio.activo ? 'Ocultar' : 'Mostrar'} {servicio.nombre}"
					class="relative h-6 w-11 rounded-full transition {servicio.activo ? 'bg-success' : 'bg-line'}"
				>
					<span
						class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all {servicio.activo
							? 'left-5.5'
							: 'left-0.5'}"
					></span>
				</button>
			</form>
			<form method="POST" action="/app/servicios?/eliminar" use:enhance>
				<input type="hidden" name="id" value={servicio.id} />
				<button type="submit" aria-label="Eliminar {servicio.nombre}" class="text-ink-faint px-1 text-lg">✕</button>
			</form>
		</div>
	{:else}
		<p class="text-ink-soft rounded-card bg-white px-4 py-5 text-center text-sm shadow-sm">
			Aún no tienes servicios. Agrega el primero 👇
		</p>
	{/each}
</div>

<form method="POST" action="/app/servicios?/agregar" use:enhance class="rounded-card mt-2.5 flex flex-col gap-3 bg-white p-4 shadow-sm">
	<p class="text-ink-soft text-xs font-bold tracking-wider uppercase">Nuevo servicio</p>
	<input name="nombre" required placeholder="Corte + brushing" class={inputCls} />
	<div class="flex gap-3">
		<label class="flex min-w-0 flex-1 flex-col gap-1">
			<span class="text-ink-soft text-xs font-semibold">Duración (min)</span>
			<input name="duracionMin" type="number" required min="5" step="5" placeholder="60" class={inputCls} />
		</label>
		<label class="flex min-w-0 flex-1 flex-col gap-1">
			<span class="text-ink-soft text-xs font-semibold">Precio (CLP)</span>
			<input name="precio" type="number" required min="0" step="500" placeholder="25000" class={inputCls} />
		</label>
	</div>
	{#if error}<p class="text-blush-deep bg-blush rounded-field px-4 py-2.5 text-sm">{error}</p>{/if}
	<button
		type="submit"
		class="rounded-field from-primary to-primary-light shadow-primary/40 bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-lg transition active:scale-[.98]"
	>
		+ Agregar servicio
	</button>
</form>
