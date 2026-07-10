<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let enviando = $state(false);
</script>

<svelte:head><title>Crear cuenta · tuhorafácil</title></svelte:head>

<div class="rounded-card shadow-primary/10 w-full max-w-sm bg-white p-7 shadow-lg">
	<h1 class="text-xl font-bold tracking-tight">Crea tu cuenta</h1>
	<p class="text-ink-soft mt-1 text-sm">Tu agenda lista en menos de 10 minutos.</p>

	<form
		method="POST"
		class="mt-6 flex flex-col gap-4"
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				enviando = false;
				await update();
			};
		}}
	>
		<label class="flex flex-col gap-1.5">
			<span class="text-ink text-sm font-semibold">Tu nombre</span>
			<input
				name="nombre"
				type="text"
				required
				autocomplete="name"
				value={form?.nombre ?? ''}
				class="input-base bg-surface"
			/>
		</label>
		<label class="flex flex-col gap-1.5">
			<span class="text-ink text-sm font-semibold">Email</span>
			<input
				name="email"
				type="email"
				required
				autocomplete="email"
				value={form?.email ?? ''}
				class="input-base bg-surface"
			/>
		</label>
		<label class="flex flex-col gap-1.5">
			<span class="text-ink text-sm font-semibold">Contraseña</span>
			<input
				name="password"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
				class="input-base bg-surface"
			/>
			<span class="text-ink-faint text-xs">Mínimo 8 caracteres</span>
		</label>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={enviando}
			class="btn-primary rounded-field mt-1 px-4 py-3 text-sm disabled:opacity-60"
		>
			{enviando ? 'Creando…' : 'Crear cuenta'}
		</button>
	</form>

	<p class="text-ink-soft mt-5 text-center text-sm">
		¿Ya tienes cuenta? <a href="/login" class="text-blush-deep font-semibold">Inicia sesión</a>
	</p>
</div>
