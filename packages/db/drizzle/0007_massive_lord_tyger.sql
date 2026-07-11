CREATE TABLE `recordatorios` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`cita_id` text NOT NULL,
	`clienta_id` text NOT NULL,
	`contenido` text NOT NULL,
	`estado` text DEFAULT 'simulado' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clienta_id`) REFERENCES `clientas_finales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recordatorios_cita_id_unique` ON `recordatorios` (`cita_id`);--> statement-breakpoint
CREATE INDEX `recordatorios_estilista_idx` ON `recordatorios` (`estilista_id`);