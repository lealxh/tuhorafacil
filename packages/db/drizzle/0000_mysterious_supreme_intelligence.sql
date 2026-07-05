CREATE TABLE `bloqueos` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`fecha_inicio` integer NOT NULL,
	`fecha_fin` integer NOT NULL,
	`motivo` text,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bloqueos_estilista_idx` ON `bloqueos` (`estilista_id`);--> statement-breakpoint
CREATE TABLE `citas` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`clienta_id` text NOT NULL,
	`servicio_id` text NOT NULL,
	`fecha` text NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL,
	`estado` text DEFAULT 'confirmada' NOT NULL,
	`origen` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clienta_id`) REFERENCES `clientas_finales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `citas_estilista_fecha_idx` ON `citas` (`estilista_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `clientas_finales` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text NOT NULL,
	`notas` text,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientas_estilista_telefono_idx` ON `clientas_finales` (`estilista_id`,`telefono`);--> statement-breakpoint
CREATE TABLE `config_agente` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`personalidad` text DEFAULT 'cercana' NOT NULL,
	`msg_bienvenida` text,
	`instrucciones` text,
	`info_extra` text,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `config_agente_estilista_id_unique` ON `config_agente` (`estilista_id`);--> statement-breakpoint
CREATE TABLE `consumo_mensual` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`mes` text NOT NULL,
	`mensajes_agente` integer DEFAULT 0 NOT NULL,
	`tokens_entrada` integer DEFAULT 0 NOT NULL,
	`tokens_salida` integer DEFAULT 0 NOT NULL,
	`conversaciones_meta` integer DEFAULT 0 NOT NULL,
	`citas_creadas` integer DEFAULT 0 NOT NULL,
	`costo_estimado_usd` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consumo_estilista_mes_idx` ON `consumo_mensual` (`estilista_id`,`mes`);--> statement-breakpoint
CREATE TABLE `conversaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`clienta_id` text NOT NULL,
	`ultimo_mensaje_at` integer NOT NULL,
	`estado` text DEFAULT 'activa' NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clienta_id`) REFERENCES `clientas_finales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversaciones_estilista_clienta_idx` ON `conversaciones` (`estilista_id`,`clienta_id`);--> statement-breakpoint
CREATE TABLE `estilistas` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`tier_id` text NOT NULL,
	`estado` text DEFAULT 'activa' NOT NULL,
	`slug_publico` text NOT NULL,
	`nombre_negocio` text NOT NULL,
	`wa_phone_number_id` text,
	`wa_waba_id` text,
	`wa_access_token_enc` text,
	`wa_estado` text DEFAULT 'desconectado' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estilistas_email_unique` ON `estilistas` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `estilistas_slug_publico_unique` ON `estilistas` (`slug_publico`);--> statement-breakpoint
CREATE TABLE `horarios` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`dia_semana` integer NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `horarios_estilista_idx` ON `horarios` (`estilista_id`);--> statement-breakpoint
CREATE TABLE `mensajes` (
	`id` text PRIMARY KEY NOT NULL,
	`conversacion_id` text NOT NULL,
	`rol` text NOT NULL,
	`contenido` text NOT NULL,
	`tokens_entrada` integer,
	`tokens_salida` integer,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`conversacion_id`) REFERENCES `conversaciones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mensajes_conversacion_idx` ON `mensajes` (`conversacion_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `plantillas_wa` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`wa_template_id` text,
	`idioma` text DEFAULT 'es' NOT NULL,
	`parametros_json` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plantillas_wa_nombre_unique` ON `plantillas_wa` (`nombre`);--> statement-breakpoint
CREATE TABLE `servicios` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`duracion_min` integer NOT NULL,
	`precio` integer NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `servicios_estilista_idx` ON `servicios` (`estilista_id`);--> statement-breakpoint
CREATE TABLE `tiers` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`precio_usd` real NOT NULL,
	`limite_mensajes_mes` integer,
	`tiene_agente` integer DEFAULT false NOT NULL,
	`tiene_recordatorios` integer DEFAULT false NOT NULL,
	`tiene_campanas` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tiers_nombre_unique` ON `tiers` (`nombre`);