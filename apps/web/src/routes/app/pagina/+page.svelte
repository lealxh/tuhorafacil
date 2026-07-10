<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import HorariosEditor from '$lib/components/HorariosEditor.svelte';
	import ServiciosEditor from '$lib/components/ServiciosEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const slug = $derived(data.estilista?.slugPublico ?? '');
	const url = $derived(`${page.url.origin}/@${slug}`);
	let copiado = $state(false);
	let tab: 'pagina' | 'servicios' | 'horarios' = $state('pagina');
	let rubroElegido = $state(data.estilista?.rubro ?? 'Peluquería');

	const RUBROS = ['Peluquería', 'Uñas', 'Estética'];
	const TABS = [
		['pagina', 'Página'],
		['servicios', 'Servicios'],
		['horarios', 'Horarios']
	] as const;
	async function copiar() {
		await navigator.clipboard.writeText(url);
		copiado = true;
		setTimeout(() => (copiado = false), 2000);
	}
</script>

<svelte:head><title>Mi página · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6 lg:p-8">
	<div class="lg:hidden">
		<h1 class="text-2xl font-bold tracking-tight">Mi página</h1>
		<p class="text-ink-soft mt-0.5 text-sm">Todo lo que ven tus clientas, editable aquí.</p>
	</div>

	{#snippet linkBar()}
		<div class="rounded-card flex items-center gap-3 bg-white px-4 py-3.5 shadow-sm">
			<p class="text-ink-soft min-w-0 flex-1 truncate text-sm">
				tuhorafacil.cl/<span class="text-ink font-bold">@{slug}</span>
			</p>
			<button onclick={copiar} class="btn-primary rounded-field flex-none px-4 py-2.5 text-xs">
				{copiado ? 'Copiado ✓' : 'Copiar link'}
			</button>
		</div>
	{/snippet}

	<div class="contents lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
		<div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
			<!-- Link público: en móvil aquí; en desktop va en la columna del preview -->
			<div class="lg:hidden">{@render linkBar()}</div>

			<!-- Tabs -->
			<div class="bg-track flex gap-1 rounded-2xl p-1">
				{#each TABS as [valor, etiqueta] (valor)}
					<button
						onclick={() => (tab = valor)}
						class="flex-1 rounded-[13px] py-2 text-center text-[13px] font-semibold {tab === valor
							? 'text-ink bg-white shadow-sm'
							: 'text-ink-soft'}"
					>
						{etiqueta}
					</button>
				{/each}
			</div>

			{#if tab === 'pagina'}
				<form
					method="POST"
					action="?/foto"
					enctype="multipart/form-data"
					use:enhance
					class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm"
				>
					<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Foto de perfil</h2>
					<div class="flex items-center gap-3.5">
						{#if data.estilista?.fotoUrl}
							<img
								src={data.estilista.fotoUrl}
								alt="Foto de perfil"
								class="h-14 w-14 rounded-2xl object-cover"
							/>
						{:else}
							<div
								class="border-line bg-line flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed text-2xl"
							>
								📷
							</div>
						{/if}
						<label
							class="rounded-field bg-blush text-blush-deep cursor-pointer px-4 py-2.5 text-xs font-bold"
						>
							Elegir imagen
							<input
								type="file"
								name="foto"
								accept="image/jpeg,image/png,image/webp"
								class="hidden"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</label>
					</div>
					{#if form && 'error' in form && form.error}<p
							class="text-blush-deep text-xs font-semibold"
						>
							{form.error}
						</p>{/if}
					{#if form && 'fotoGuardada' in form}<p class="text-success text-xs font-semibold">
							Foto actualizada ✓
						</p>{/if}
				</form>

				<form
					method="POST"
					action="?/negocio"
					use:enhance
					class="rounded-card flex flex-col gap-4 bg-white p-4 shadow-sm"
				>
					<div>
						<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Bio</h2>
						<textarea
							name="bio"
							rows="3"
							maxlength="300"
							placeholder="Peluquería y color en Providencia 🌿 Especialista en balayage. Reserva tu hora aquí abajo 👇"
							class="input-base bg-surface mt-3 w-full">{data.estilista?.bio ?? ''}</textarea
						>
					</div>

					<div class="flex flex-col gap-3">
						<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">
							Datos del negocio
						</h2>
						<label class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold">Nombre del negocio</span>
							<input
								name="nombreNegocio"
								required
								value={data.estilista?.nombreNegocio ?? ''}
								class="input-base bg-surface"
							/>
						</label>
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold">Rubro</span>
							<div class="flex gap-2">
								{#each RUBROS as rubro (rubro)}
									<button
										type="button"
										onclick={() => (rubroElegido = rubro)}
										class="rounded-field flex-1 border px-3 py-2.5 text-sm font-semibold transition {rubroElegido ===
										rubro
											? 'border-primary bg-blush text-blush-deep'
											: 'border-line text-ink-soft bg-white'}"
									>
										{rubro}
									</button>
								{/each}
							</div>
							<input type="hidden" name="rubro" value={rubroElegido} />
						</div>
						<label class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold">Comuna</span>
							<input
								name="comuna"
								value={data.estilista?.comuna ?? ''}
								placeholder="Providencia"
								class="input-base bg-surface"
							/>
						</label>
					</div>

					{#if form && 'error' in form && form.error}<p class="form-error">
							{form.error}
						</p>{/if}
					{#if form && 'guardado' in form}<p class="text-success text-xs font-semibold">
							Guardado ✓
						</p>{/if}
					<button type="submit" class="btn-primary rounded-field px-4 py-3 text-sm">
						Guardar
					</button>
				</form>
			{:else if tab === 'servicios'}
				<div>
					<div class="mb-2.5 flex items-baseline justify-between">
						<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">
							Servicios visibles
						</h2>
						<span class="text-ink-faint text-[11px]">Toca el switch para mostrar / ocultar</span>
					</div>
					<ServiciosEditor
						servicios={data.servicios}
						error={form && 'error' in form ? form.error : null}
					/>
				</div>
			{:else}
				<form method="POST" action="?/horarios" use:enhance class="flex flex-col gap-2">
					<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">
						Tus horarios de atención
					</h2>
					<HorariosEditor horarios={data.horarios} />
					{#if form && 'error' in form && form.error}<p class="form-error">
							{form.error}
						</p>{/if}
					{#if form && 'guardado' in form}<p
							class="text-success bg-success/10 rounded-field px-4 py-2.5 text-sm font-semibold"
						>
							Horarios guardados ✓
						</p>{/if}
					<button type="submit" class="btn-primary rounded-field mt-1 px-4 py-3 text-sm">
						Guardar horarios
					</button>
				</form>
			{/if}
		</div>

		<!-- Vista previa en vivo (mock desktop) -->
		<div class="hidden lg:block">
			{@render linkBar()}
			<h2 class="text-ink-soft mt-4 text-xs font-bold tracking-wider uppercase">
				Vista previa en vivo
			</h2>
			<div
				class="mt-3 rounded-[28px] bg-[#141012] p-2 shadow-[0_20px_40px_-16px_rgba(80,40,30,.4)]"
			>
				<iframe
					src="/@{slug}"
					title="Vista previa de tu página"
					class="h-[520px] w-full rounded-[22px] border-0 bg-white"
				></iframe>
			</div>
			<a
				href="/@{slug}"
				target="_blank"
				class="rounded-field text-blush-deep mt-3 block bg-white px-4 py-3 text-center text-sm font-semibold shadow-sm"
			>
				Abrir página completa ›
			</a>
		</div>
	</div>
</main>
