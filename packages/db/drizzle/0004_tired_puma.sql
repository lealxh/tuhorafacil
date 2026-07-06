CREATE TABLE `suscripciones` (
	`id` text PRIMARY KEY NOT NULL,
	`estilista_id` text NOT NULL,
	`tier_id` text NOT NULL,
	`monto_clp` integer NOT NULL,
	`metodo_pago` text DEFAULT 'mock_webpay' NOT NULL,
	`estado` text DEFAULT 'pagado_mock' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`estilista_id`) REFERENCES `estilistas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `suscripciones_estilista_idx` ON `suscripciones` (`estilista_id`);