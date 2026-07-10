<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const inputCls = 'input-base bg-surface';
	const waConectado = $derived(data.estilista?.waEstado === 'activo');
</script>

<svelte:head><title>Cuenta · tuhorafácil</title></svelte:head>

<main class="flex flex-col gap-4 p-6 lg:mx-auto lg:w-full lg:max-w-2xl lg:p-8">
	<div class="lg:hidden">
		<a href="/app" class="text-ink-soft text-xs font-semibold">‹ Hoy</a>
		<h1 class="mt-1 text-2xl font-bold tracking-tight">Tu cuenta</h1>
		<p class="text-ink-soft mt-0.5 text-sm">{data.user.email}</p>
	</div>

	<!-- Perfil -->
	<form method="POST" action="?/perfil" use:enhance class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Perfil</h2>
		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-semibold">Tu nombre</span>
			<input name="nombre" required value={data.user.name} class={inputCls} />
		</label>
		{#if form?.seccion === 'perfil'}
			{#if 'error' in form && form.error}<p class="form-error">{form.error}</p>
			{:else}<p class="text-success text-xs font-semibold">Guardado ✓</p>{/if}
		{/if}
		<button type="submit" class="rounded-field bg-blush text-blush-deep px-4 py-2.5 text-sm font-bold">Guardar</button>
	</form>

	<!-- Contraseña -->
	<form method="POST" action="?/password" use:enhance class="rounded-card flex flex-col gap-3 bg-white p-4 shadow-sm">
		<h2 class="text-ink-soft text-xs font-bold tracking-wider uppercase">Cambiar contraseña</h2>
		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-semibold">Contraseña actual</span>
			<input name="actual" type="password" required autocomplete="current-password" class={inputCls} />
		</label>
		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-semibold">Contraseña nueva</span>
			<input name="nueva" type="password" required minlength="8" autocomplete="new-password" class={inputCls} />
			<span class="text-ink-faint text-xs">Mínimo 8 caracteres. Cierra tus otras sesiones.</span>
		</label>
		{#if form?.seccion === 'password'}
			{#if 'error' in form && form.error}<p class="form-error">{form.error}</p>
			{:else}<p class="text-success text-xs font-semibold">Contraseña actualizada ✓</p>{/if}
		{/if}
		<button type="submit" class="rounded-field bg-blush text-blush-deep px-4 py-2.5 text-sm font-bold">Cambiar</button>
	</form>

	<!-- WhatsApp -->
	<div class="rounded-card flex items-center gap-3 bg-white p-4 shadow-sm">
		<span class="bg-blush flex h-10 w-10 flex-none items-center justify-center rounded-xl text-lg">💬</span>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold">WhatsApp {waConectado ? 'conectado' : 'sin conectar'}</p>
			<p class="text-ink-soft text-xs">
				{waConectado
					? 'Tu agente está operando con tu número.'
					: 'La conexión con tu número se activa cuando Meta apruebe la plataforma.'}
			</p>
		</div>
		<span class="h-2.5 w-2.5 flex-none rounded-full {waConectado ? 'bg-success' : 'bg-line'}"></span>
	</div>

	<!-- Cerrar sesión -->
	<form method="POST" action="?/logout" use:enhance>
		<button type="submit" class="rounded-field border-line text-blush-deep w-full border bg-white px-4 py-3 text-sm font-bold">
			Cerrar sesión
		</button>
	</form>
</main>
