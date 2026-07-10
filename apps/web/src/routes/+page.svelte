<script lang="ts">
	import { clp } from '$lib/plan';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const CTA_LABEL = 'Pruébalo gratis';

	const PLANES = [
		{
			id: 'agenda',
			nombre: 'Agenda',
			tagline: 'Ordena tus citas',
			features: [
				'Calendario simple, hecho para ti',
				'Tu link de reserva para compartir',
				'Tus servicios, precios y horarios'
			],
			badge: 'Gratis por 3 meses',
			btnLabel: 'Prueba 3 meses gratis',
			destacado: false,
			href: '/registro'
		},
		{
			id: 'recepcionista',
			nombre: 'Recepcionista',
			tagline: 'Tu asistente en WhatsApp',
			features: [
				'Todo lo del plan Agenda',
				'Asistente que responde tu WhatsApp',
				'Agenda citas por ti mientras trabajas',
				'Te avisa solo cuando te necesita'
			],
			badge: 'El favorito',
			btnLabel: 'Elegir Recepcionista',
			destacado: true,
			href: '/registro?plan=recepcionista'
		},
		{
			id: 'pro',
			nombre: 'Pro',
			tagline: 'Que ninguna se olvide',
			features: [
				'Todo lo del plan Recepcionista',
				'Recordatorios automáticos de citas',
				'Campañas para reactivar clientas',
				'Menos horas perdidas por inasistencias'
			],
			badge: null,
			btnLabel: 'Elegir Pro',
			destacado: false,
			href: '/registro?plan=pro'
		}
	] as const;

	const PROBLEMAS = [
		{
			titulo: 'Mensajes que llegan mientras atiendes',
			texto: 'Con las manos en tinte, no puedes contestar. Y a la noche ya se te juntaron 20.'
		},
		{
			titulo: 'Citas que se te cruzan',
			texto: 'Anotar en el cuaderno o en la cabeza termina en dos clientas a la misma hora.'
		},
		{
			titulo: 'Clientas que no esperan',
			texto:
				'Si no respondes en una hora, agenda con otra. Cada mensaje sin responder es plata que se va.'
		}
	];

	const PASOS = [
		{
			numero: 1,
			titulo: 'Conecta tu WhatsApp',
			texto: 'Escaneas un código y listo. Sigues usando tu mismo número.'
		},
		{
			numero: 2,
			titulo: 'Configura tus servicios',
			texto: 'Corte, color, balayage… con sus precios, duración y tus horarios.'
		},
		{
			numero: 3,
			titulo: 'El asistente agenda por ti',
			texto: 'Responde, ofrece horas libres y confirma. Tú solo ves tu agenda llenarse.'
		}
	];

	const btnCta = 'from-primary to-primary-light bg-gradient-to-br font-bold text-white';
</script>

<svelte:head>
	<title>tuhorafácil — tu asistente en WhatsApp para agendar citas</title>
	<meta
		name="description"
		content="Mientras atiendes, tu asistente responde el WhatsApp y agenda las citas por ti. Hecho para estilistas independientes en Chile."
	/>
</svelte:head>

<div class="bg-surface min-h-screen overflow-x-hidden">
	<!-- NAV -->
	<div class="bg-[rgba(252,246,243,.88)] border-line sticky top-0 z-50 border-b backdrop-blur-md">
		<div class="mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-5 py-3.5">
			<div class="flex items-center gap-2.5">
				<div
					class="from-primary to-primary-light shadow-primary/40 flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br text-[17px] font-extrabold text-white shadow-md"
				>
					t
				</div>
				<div class="text-[17px] font-bold tracking-tight">tuhorafácil</div>
			</div>
			<a
				href="#planes"
				class="{btnCta} shadow-primary/40 flex min-h-11 items-center rounded-2xl px-5 py-3 text-sm shadow-lg"
			>
				{CTA_LABEL}
			</a>
		</div>
	</div>

	<!-- HERO -->
	<div
		class="relative bg-[radial-gradient(130%_100%_at_50%_0%,#FBE4DA_0%,#F8EDE6_60%,#FCF6F3_100%)]"
	>
		<div
			class="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-10 px-5 py-16 lg:gap-16 lg:py-24"
		>
			<div class="min-w-[290px] max-w-[520px] flex-1">
				<div
					class="border-line inline-flex items-center gap-2 rounded-[22px] border bg-white/75 px-3.5 py-1.5 text-[13px] font-semibold text-[#B06A54]"
				>
					<span class="bg-success inline-block h-2 w-2 animate-pulse rounded-full"></span>
					Hecho para estilistas en Chile
				</div>
				<h1
					class="mt-4.5 text-[clamp(32px,6.5vw,52px)] leading-[1.1] font-extrabold tracking-[-.025em] text-balance"
				>
					Deja de perder clientas por no contestar el WhatsApp
				</h1>
				<p
					class="mt-4 max-w-[44ch] text-[clamp(16px,2.4vw,19px)] leading-relaxed text-[#7C6059] text-balance"
				>
					Mientras tú atiendes, tu asistente responde los mensajes y agenda las citas por ti. Sin
					apps raras, en el mismo WhatsApp de siempre.
				</p>
				<div class="mt-6.5 flex flex-wrap items-center gap-3">
					<a
						href="#planes"
						class="{btnCta} shadow-primary/60 inline-flex min-h-13 items-center rounded-2xl px-7 py-4 text-[16.5px] shadow-xl"
					>
						{CTA_LABEL}
					</a>
					<a
						href="#como"
						class="text-ink flex min-h-13 items-center px-3 py-4 text-[15px] font-semibold"
					>
						Ver cómo funciona →
					</a>
				</div>
				<div class="text-ink-faint mt-4 text-[13px]">
					Plan Agenda gratis por 3 meses · Sin tarjeta
				</div>
			</div>

			<!-- chat mock -->
			<div class="w-full min-w-[280px] flex-[0_1_330px]">
				<div
					class="border-primary/10 shadow-primary/20 overflow-hidden rounded-[26px] border bg-white shadow-2xl"
				>
					<div class="bg-blush flex items-center gap-2.5 px-4 py-3.5">
						<div
							class="from-primary to-primary-light flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-[15px] font-bold text-white"
						>
							C
						</div>
						<div>
							<div class="text-sm font-bold">Camila · Salón Regias</div>
							<div class="text-success text-[11.5px] font-semibold">tu asistente responde</div>
						</div>
					</div>
					<div class="bg-background flex flex-col gap-2.5 p-4">
						<div
							class="max-w-[82%] self-start rounded-[16px_16px_16px_5px] bg-white px-3.5 py-2.5 text-[13.5px] leading-snug shadow-sm"
						>
							Hola! tienes hora para balayage el sábado?
						</div>
						<div
							class="max-w-[82%] self-end rounded-[16px_16px_5px_16px] bg-[#E7F6DE] px-3.5 py-2.5 text-[13.5px] leading-snug shadow-sm"
						>
							¡Hola Fran! El sábado tengo a las 11:00 o a las 15:30. ¿Cuál te acomoda?
						</div>
						<div
							class="max-w-[82%] self-start rounded-[16px_16px_16px_5px] bg-white px-3.5 py-2.5 text-[13.5px] leading-snug shadow-sm"
						>
							A las 11 porfa!
						</div>
						<div
							class="max-w-[82%] self-end rounded-[16px_16px_5px_16px] bg-[#E7F6DE] px-3.5 py-2.5 text-[13.5px] leading-snug shadow-sm"
						>
							Listo, sábado 11:00 · Balayage. Te llegará un recordatorio el día antes.
						</div>
						<div
							class="text-blush-deep mt-1 self-center rounded-full bg-[#D97F6A]/12 px-3.5 py-1.5 text-[11.5px] font-bold"
						>
							Agendado mientras Camila atendía
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- PROBLEMA -->
	<div class="mx-auto max-w-[1080px] px-5 pt-16 lg:pt-20">
		<div class="mx-auto max-w-[560px] text-center">
			<div class="text-[12.5px] font-bold tracking-[.08em] text-[#C08A76] uppercase">
				Te suena familiar
			</div>
			<h2
				class="mt-3 text-[clamp(26px,4.5vw,38px)] leading-[1.15] font-extrabold tracking-[-.02em] text-balance"
			>
				Tu día no te deja contestar. Y eso cuesta clientas.
			</h2>
		</div>
		<div class="mx-auto mt-10 flex max-w-[680px] flex-col lg:mt-12">
			{#each PROBLEMAS as p, i (p.titulo)}
				<div
					class="border-line flex items-start gap-4.5 border-t px-1 py-5.5 {i ===
					PROBLEMAS.length - 1
						? 'border-b'
						: ''}"
				>
					<svg
						class="mt-0.5 flex-none"
						width="26"
						height="26"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#C08A76"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						{#if i === 0}
							<path d="M4 11.5a7.5 6.5 0 1 1 3 5.2L3.5 18l.9-2.6A6.3 6.3 0 0 1 4 11.5Z" />
							<path d="M8.5 10.5h7M8.5 13.5h4" />
						{:else if i === 1}
							<rect x="3.5" y="5" width="17" height="15" rx="4" />
							<path d="M3.5 9.5h17M8 3v4M16 3v4M9 14l2 2 4-4" />
						{:else}
							<circle cx="10" cy="8" r="3.2" />
							<path d="M4.5 19c.6-3.2 2.8-5 5.5-5 1.1 0 2.1.3 3 .9" />
							<path d="M15 15l5 5M20 15l-5 5" />
						{/if}
					</svg>
					<div>
						<div class="text-[17px] font-bold">{p.titulo}</div>
						<p class="mt-1.5 text-[14.5px] leading-relaxed text-[#7C6059]">{p.texto}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- COMO FUNCIONA -->
	<div id="como" class="mx-auto max-w-[1080px] px-5 pt-20 lg:pt-24">
		<div class="mx-auto max-w-[560px] text-center">
			<div class="text-[12.5px] font-bold tracking-[.08em] text-[#C08A76] uppercase">
				Cómo funciona
			</div>
			<h2
				class="mt-3 text-[clamp(26px,4.5vw,38px)] leading-[1.15] font-extrabold tracking-[-.02em] text-balance"
			>
				Lista en 3 pasos, sin saber de tecnología
			</h2>
		</div>
		<div
			class="mt-10 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] rounded-[28px] bg-[linear-gradient(160deg,#FBE4DA,#F8EDE6)] px-5 py-2 lg:mt-12 lg:px-8"
		>
			{#each PASOS as paso, i (paso.numero)}
				<div
					class="border-[#B06A54]/18 {i < PASOS.length - 1
						? 'md:border-b-0'
						: ''} border-b py-6 last:border-b-0"
				>
					<div class="flex items-center gap-3">
						<div
							class="text-ink flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[#3E2C2A] text-[15px] font-extrabold text-white"
						>
							{paso.numero}
						</div>
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#B06A54"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							{#if paso.numero === 1}
								<path d="M4 11.5a7.5 6.5 0 1 1 3 5.2L3.5 18l.9-2.6A6.3 6.3 0 0 1 4 11.5Z" />
							{:else if paso.numero === 2}
								<path d="M12 8v8M8 12h8" />
								<rect x="3.5" y="3.5" width="17" height="17" rx="5" />
							{:else}
								<path
									d="M12 3l1.7 3.9 4.3.5-3.2 2.9.9 4.2L12 12.4l-3.7 2.1.9-4.2L6 7.4l4.3-.5L12 3Z"
								/>
								<path
									d="M19 15l.7 1.6 1.8.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.8-.2L19 15Z"
								/>
							{/if}
						</svg>
					</div>
					<div class="mt-3.5 text-[17px] font-bold">{paso.titulo}</div>
					<p class="mt-1.5 max-w-[30ch] text-[14.5px] leading-relaxed text-[#7C6059]">
						{paso.texto}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- PLANES -->
	<div id="planes" class="mx-auto max-w-[1080px] px-5 pt-20 lg:pt-24">
		<div class="mx-auto max-w-[560px] text-center">
			<div class="text-[12.5px] font-bold tracking-[.08em] text-[#C08A76] uppercase">Planes</div>
			<h2
				class="mt-3 text-[clamp(26px,4.5vw,38px)] leading-[1.15] font-extrabold tracking-[-.02em] text-balance"
			>
				Elige cuánta ayuda quieres
			</h2>
			<p class="text-ink-soft mt-3 text-[15.5px]">Cambia o cancela cuando quieras.</p>
		</div>
		<div
			class="mt-10 grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] items-stretch gap-4 lg:mt-12"
		>
			{#each PLANES as plan (plan.nombre)}
				<div
					class="relative flex flex-col rounded-[24px] p-7 {plan.destacado
						? 'bg-[#3E2C2A] text-[#FBEDE6] shadow-[0_26px_50px_-20px_rgba(62,44,42,.55)]'
						: 'border-line shadow-primary/10 border bg-white shadow-lg'}"
				>
					{#if plan.badge}
						<div
							class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-extrabold whitespace-nowrap shadow-[0_5px_12px_-4px_rgba(190,140,40,.5)] {plan.destacado
								? 'bg-[#EFC15E] text-[#5C4318]'
								: 'bg-[#EFC15E] text-[#5C4318]'}"
						>
							{plan.badge}
						</div>
					{/if}
					<div class="text-[18px] font-bold">{plan.nombre}</div>
					<div class="mt-1 text-[13.5px] {plan.destacado ? 'text-[#FBEDE6]/65' : 'text-ink-soft'}">
						{plan.tagline}
					</div>
					<div class="mt-4.5 flex items-baseline gap-1.5">
						<div class="text-[34px] font-extrabold tracking-[-.02em]">
							{clp(Number(data.preciosUsd[plan.id]))}
						</div>
						<div class="text-[13.5px] {plan.destacado ? 'text-[#FBEDE6]/65' : 'text-ink-soft'}">
							CLP/mes
						</div>
					</div>
					<div class="mt-5 flex flex-1 flex-col gap-2.5">
						{#each plan.features as feat (feat)}
							<div class="flex items-start gap-2.5 text-[14.5px] leading-snug">
								<span
									class="flex-none font-extrabold {plan.destacado
										? 'text-[#EFC15E]'
										: 'text-primary'}">✓</span
								>
								<span>{feat}</span>
							</div>
						{/each}
					</div>
					<a
						href={plan.href}
						class="mt-6 flex min-h-[50px] items-center justify-center rounded-2xl px-5 py-3.5 text-center text-[15px] font-bold {plan.destacado
							? 'from-primary to-primary-light shadow-primary/70 bg-gradient-to-br text-white shadow-lg'
							: 'bg-blush text-blush-deep'}"
					>
						{plan.btnLabel}
					</a>
				</div>
			{/each}
		</div>
	</div>

	<!-- TESTIMONIO -->
	<div class="mx-auto max-w-[760px] px-5 pt-20 lg:pt-24">
		<div class="px-1 text-center">
			<div class="text-primary-light text-[52px] leading-[.6] font-extrabold">"</div>
			<p
				class="mx-auto mt-2.5 max-w-[34ch] text-[clamp(18px,3vw,22px)] leading-relaxed font-semibold tracking-[-.01em] text-balance"
			>
				Antes perdía como 5 clientas a la semana por no alcanzar a contestar. Ahora se agendan solas
				mientras trabajo.
			</p>
			<div class="mt-5.5 flex items-center justify-center gap-3">
				<div
					class="text-ink-faint flex h-11 w-11 items-center justify-center rounded-full bg-[repeating-linear-gradient(45deg,#F3E4DE,#F3E4DE_6px,#EEDBD3_6px,#EEDBD3_12px)] font-mono text-[10px]"
				>
					foto
				</div>
				<div class="text-left">
					<div class="text-[14.5px] font-bold">Testimonio de estilista</div>
					<div class="text-ink-faint text-[12.5px]">placeholder · reemplazar con clienta real</div>
				</div>
			</div>
		</div>
	</div>

	<!-- CTA FINAL -->
	<div id="final" class="mx-auto max-w-[1080px] px-5 pt-20 pb-20 lg:pt-24 lg:pb-24">
		<div
			class="rounded-[30px] bg-[linear-gradient(125deg,#D97F6A,#E0937E_55%,#E8A98F)] px-6 py-12 text-center text-white shadow-[0_30px_60px_-24px_rgba(217,127,106,.6)] lg:px-14 lg:py-16"
		>
			<h2
				class="text-[clamp(28px,5vw,42px)] leading-[1.12] font-extrabold tracking-[-.02em] text-balance"
			>
				Tu próxima clienta te está escribiendo ahora
			</h2>
			<p
				class="mx-auto mt-3.5 max-w-[42ch] text-[clamp(15px,2.4vw,17.5px)] leading-relaxed text-balance opacity-90"
			>
				Parte con el plan Agenda gratis por 3 meses, sin tarjeta. Lo configuras en 10 minutos.
			</p>
			<a
				href="#planes"
				class="text-blush-deep mt-7 inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-white px-8.5 py-4 text-[17px] font-extrabold shadow-[0_14px_30px_-10px_rgba(60,20,10,.35)]"
			>
				{CTA_LABEL}
			</a>
			<div class="mt-3.5 text-[13px] opacity-85">
				Sin tarjeta de crédito · Cancela cuando quieras
			</div>
		</div>
	</div>

	<!-- FOOTER -->
	<div class="border-line border-t">
		<div
			class="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-5 py-6.5"
		>
			<div class="flex items-center gap-2">
				<div
					class="from-primary to-primary-light flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-gradient-to-br text-[13px] font-extrabold text-white"
				>
					t
				</div>
				<div class="text-sm font-bold">tuhorafácil</div>
			</div>
			<div class="text-ink-faint text-[12.5px]">
				Hecho con cariño en Chile · hola@tuhorafacil.cl
			</div>
		</div>
	</div>
</div>
