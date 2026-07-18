ALTER TABLE `mensajes` ADD `wa_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `mensajes_wa_id_unique` ON `mensajes` (`wa_id`);