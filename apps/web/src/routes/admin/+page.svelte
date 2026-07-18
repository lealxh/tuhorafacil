<script lang="ts">
	import { enhance } from '$app/forms';
	import { NOMBRES } from '$lib/plan';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// 4 decimales para no ocultar costos de sub-centavo (mensajes sueltos cuestan milésimas)
	const usd = (n: number | null) => '$' + (n ?? 0).toFixed(4);
</script>

<svelte:head><title>Admin · tuhorafácil</title></svelte:head>

<main class="p-6 lg:p-8">
	<h2 class="text-ink-soft mb-4 text-xs font-bold tracking-wider uppercase">
		Cuentas ({data.cuentas.length})
	</h2>

	<div class="overflow-x-auto">
		<table class="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
			<thead>
				<tr class="text-ink-soft text-left text-[11px] tracking-wider uppercase">
					<th class="px-3">Negocio</th>
					<th class="px-3">Estado</th>
					<th class="px-3">WhatsApp</th>
					<th class="px-3">Plan</th>
					<th class="px-3 text-right">Mensajes/mes</th>
					<th class="px-3 text-right">Costo/mes</th>
					<th class="px-3">Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each data.cuentas as cuenta (cuenta.id)}
					<tr class="bg-white shadow-sm">
						<td class="rounded-l-card px-3 py-3">
							<p class="font-semibold">{cuenta.nombreNegocio}</p>
							<p class="text-ink-faint text-xs">{cuenta.email}</p>
						</td>
						<td class="px-3">
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-bold {cuenta.estado === 'activa'
									? 'bg-success/15 text-success'
									: 'bg-blush text-blush-deep'}"
							>
								{cuenta.estado}
							</span>
						</td>
						<td class="px-3">
							{#if cuenta.waEstado === 'activo'}
								<form method="POST" action="?/conectarWa" use:enhance class="flex items-center gap-1.5">
									<input type="hidden" name="estilistaId" value={cuenta.id} />
									<span class="text-success text-xs font-semibold">activo</span>
									<button type="submit" class="text-ink-faint text-xs underline">desconectar</button>
								</form>
							{:else}
								<form method="POST" action="?/conectarWa" use:enhance class="flex items-center gap-1">
									<input type="hidden" name="estilistaId" value={cuenta.id} />
									<input
										name="phoneNumberId"
										placeholder="phone_number_id"
										class="rounded-field border-line bg-surface w-32 border px-2 py-1 text-xs"
									/>
									<button type="submit" class="text-blush-deep text-xs font-bold">ok</button>
								</form>
							{/if}
						</td>
						<td class="px-3">
							<form
								method="POST"
								action="?/cambiarTier"
								use:enhance
								class="flex items-center gap-1"
							>
								<input type="hidden" name="estilistaId" value={cuenta.id} />
								<select
									name="tierId"
									class="rounded-field border-line bg-surface border px-2 py-1 text-xs"
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each data.tiers as tier (tier.id)}
										<option value={tier.id} selected={tier.id === cuenta.tierId}
											>{NOMBRES[tier.nombre]}</option
										>
									{/each}
								</select>
							</form>
						</td>
						<td class="px-3 text-right font-medium">{cuenta.mensajes ?? 0}</td>
						<td class="px-3 text-right font-medium">{usd(cuenta.costoUsd)}</td>
						<td class="rounded-r-card px-3">
							<form
								method="POST"
								action={cuenta.estado === 'activa' ? '?/pausar' : '?/reactivar'}
								use:enhance
							>
								<input type="hidden" name="estilistaId" value={cuenta.id} />
								<button
									type="submit"
									class="rounded-field border-line border bg-white px-3 py-1.5 text-xs font-bold {cuenta.estado ===
									'activa'
										? 'text-blush-deep'
										: 'text-success'}"
								>
									{cuenta.estado === 'activa' ? 'Pausar' : 'Reactivar'}
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
